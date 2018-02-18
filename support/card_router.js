'use strict'
const express = require('express');

const smartcard = require('smartcard');
const Devices = smartcard.Devices;
const Iso7816Application = smartcard.Iso7816Application;
const uuidv4 = require('uuid/v4');
const xor = require('bitwise-xor');
const secureRandom = require('secure-random');
const ecurve = require('ecurve');
const BigInteger = require('bigi');
const hash = require('hash.js');
const elliptic = require('elliptic');
var constants = require('./constants');
var Promise = require('any-promise');
var rp = require('request-promise-any');
const CommandApdu = smartcard.CommandApdu;
const ResponseApdu = smartcard.ResponseApdu;

var readers = new Map();
var cardsInserted = new Map();

var readersInverse = new Map();
var cardsInsertedInverse = new Map();

const devices = new Devices();


const EC = elliptic.ec;
const ShortCurve = elliptic.curve.short;

var router = express.Router();
const secp192k1_conf = {
    type: 'short',
    prime: null,
    p: 'ffffffff ffffffff ffffffff ffffffff fffffffe ffffee37',
    a: '00000000 00000000 00000000 00000000 00000000 00000000',
    b: '00000000 00000000 00000000 00000000 00000000 00000003',
    n: 'ffffffff ffffffff fffffffe 26f2fc17 0f69466a 74defd8d',
    hash: hash.sha1,
    gRed: false,
    g: [
        'db4ff10e c057e9ae 26b07d02 80b7f434 1da5d1b1 eae06c7d',
        '9b2f2f6d 9c5628a7 844163d0 15be8634 4082aa88 d95e2f9d'
    ]
};

const PresetCurve = elliptic.curves.PresetCurve;
const secp192k1 = new PresetCurve(secp192k1_conf);

const ec = new EC({
    curve: secp192k1,
    hash: hash.sha1
});

function executeWriteToCard(card, data, slot) {
    let cmd = {
        'cla': 0x24, // For the card
        'ins': 0x01, // DATA_WRITE
        'p1': slot, // choose slot
        'p2': 0x11, // arbitrary
        'data': data
    };
    return sendAPDU(card, cmd);
}

function fetchIdentity(card) {
    let cmd = {
        "cla": 0x24,
        "ins": 0x05, // READ_DATA
        "p1": 0x00, // IDENTITY
        "p2": 0x11, // arbitrary
        "le": 255
    };
}

function verifySignature(allegedKey, allegedData, allegedSignature) {
    let pub = {
            x: allegedKey.point.x,
            y: allegedkey.point.y,
        };

    let thehash = hash.sha1().update(allegedData).digest('hex');
    return ec.verify(thehash, allegedSignature.toString('hex'), pub);
}

function parsePublicKeyFromBuffer(buf) {
    let ret = {};
    let currentIndex = 0;
    let paramNames = ["a", "b", "field", "g", "k", "r", "w"];

    for (let paramName of paramNames) {
        let currentSize = buf.readUIntBE(currentIndex, 2);
        currentIndex += 2;
        let currentParamValue;
        if (paramName !== "g" && paramName !== "w") {
            currentParamValue = BigInteger.fromBuffer(buf.slice(currentIndex, currentIndex + currentSize));
        } else {
            currentParamValue = buf.slice(currentIndex, currentIndex + currentSize);
        }
        currentIndex += currentSize;

        ret[paramName] = currentParamValue;
    }

    // p = field, a = a, b = b, n = r, h = k, Gx = g_x, Gy = g_y,
    if (ret.g[0] != 0x04) {
        console.log(`Does not support compressed points: ${ret.g[0]}`);
        return "COMPRESSED_POINT";
    }
    let keyLength = (ret.g.length - 1)/2;
    let gx = BigInteger.fromBuffer(ret.g.slice(1, 1+keyLength));
    let gy = BigInteger.fromBuffer(ret.g.slice(1+keyLength, 1+keyLength*2));
    let curve = new ecurve.Curve(ret.field, ret.a, ret.b, gx, gy, ret.r, ret.k);

    let point = ecurve.Point.decodeFrom(curve, ret.w);
    return {
        "curve": curve,
        "point": point,
        "keyLength": keyLength,
    };

}

function parsePublicKey(respApdu) {
    return parsePublicKeyFromBuffer(respApdu.buffer);
}

function savePublicKey(publicKeyObj) {
    let curve = publicKeyObj.curve;
    let field = curve.p.toBuffer();
    let fieldLen = Buffer.alloc(2);
    fieldLen.writeUInt16BE(field.length, 0);

    let a = curve.a.toBuffer();
    let aLen = Buffer.alloc(2);
    aLen.writeUInt16BE(a.length, 0);

    let b = curve.b.toBuffer();
    let bLen = Buffer.alloc(2);
    bLen.writeUInt16BE(b.length, 0);

    let G = curve.G.getEncoded(true);
    let GLen = Buffer.alloc(2);
    GLen.writeUInt16BE(G.length, 0);

    let n = curve.n.toBuffer();
    let nLen = Buffer.alloc(2);
    nLen.writeUInt16BE(n.length, 0);

    let h = curve.h.toBuffer();
    let hLen = Buffer.alloc(2);
    hLen.writeUInt16BE(h.length, 0);

    let w = publicKeyObj.point.getEncoded(false);
    let wLen = Buffer.alloc(2);
    wLen.writeUInt16BE(w.length, 0);

    return Buffer.concat([aLen, a, bLen, b, fieldLen, field, GLen, G,  hLen, h, nLen, n, wLen, w]);
}


function getPublicKey(card, kn=0) {
    let cmd = {
        "cla": 0x24, // For ID card
        "ins": 0x09, // READ_KEYS
        "p1": kn, // select key
        "p2": 0x11, // arbitrary
        "le": 255 // Expected length
    };
    return sendAPDU(card, cmd).then(resp => {
        return parsePublicKey(resp);
    });
}

function sendAPDU(card, data) {
    const application = new Iso7816Application(card);
    let cmd = new CommandApdu(data);
    return application.issueCommand(cmd).then(respApdu => {
        let b = respApdu.buffer;
        if (b[b.length-2] != 0x90 || b[b.length-1] != 0x00) {
             return Promise.reject(new Error(`Card return value ${b.toString('hex')}.`));
        } else {
            return respApdu;
        }
    });
}

function obtainSignature(card, data, pin, adminPin = Buffer.alloc(0), kn = 0) {

    let cmd_unlock = {
        "cla": 0x24,
        "ins": 0x02, // UNLOCK_CARD
        "p1": 0x11,
        "p2": 0x11,
        "data": pin,
    };
    let cmd_sign = {
        "cla": 0x24,
        "ins": 0x07, // SIGN_DATA
        "p1": kn, // select key
        "p2": 0x11, // doesn't matter
        "le": 255, // Expected length
        "data": data
    };
    if (kn != 0) {
        cmd_sign.data = Buffer.concat([adminPin, data]);
    }
    return sendAPDU(card, cmd_unlock).then(resp => {
        return sendAPDU(card, cmd_sign);
    }).then(signature => {
        let buf = signature.buffer;
        if (buf[buf.length - 2] != 0x90 || buf[buf.length - 1] != 0) {
            return Promise.reject(new Error(`Card return value ${b.toString('hex')} / signature not successful.`));
        } else {
            return buf.slice(0, buf.length-2);
        }
    });
}

devices.onActivated().then(event => {
    let device = event.device;
    console.log(`Device ${device} activated.`);
    let uu = uuidv4();
    readers.set(uu, device);
    readersInverse.set(device, uu);

    device.on('card-inserted', function(event) {
        let card = event.card;
        console.log(`Card '${card.getAtr()}' inserted.`);
        // SELECT applet command (CLA = 0x00, INS=0xA4, P1=0x04, P2=0x0, LC=0x08, LE=0x00, DATA=AID)
        let bytez = "00 A4 04 00 08 FF BB EE AA 99 13 10 72 00".split(' ').join('');
        bytez = Buffer.from(bytez, 'hex');
        let cmd = {
            bytes: bytez
        };
        sendAPDU(card, cmd).then(resp => {
            let uu2 = uuidv4();
            cardsInserted.set(uu2, card);
            cardsInsertedInverse.set(card, uu2);
            console.log(`Card '${card.getAtr()}' successfully switched to applet.`);
        }).catch(e => {
            console.log(`Error happened when selecting applet: ${e}. Perhaps this is the wrong card?`);
        });


    });

    device.on('card-removed', function(event) {
        let card = event.card;
        console.log(`Card '${card.getAtr()}' removed.`);
        cardsInserted.delete(cardsInsertedInverse[card]);
        cardsInsertedInverse.delete(card);
    });
}).catch(e => {
    console.log(e);
});

devices.onDeactivated().then(event => {
   let uu = readersInverse.get(event.device);
   readers.delete(uu);
   readersInverse.delete(event.device);
});

router.get('/inserted', function (req, res) {
    res.status(200);
    let resp = {};
    resp.readers = {};
    readers.forEach((value, key, mapp) => {
        resp.readers[key] = value.toString();
    });
    resp.cards = {};
    cardsInserted.forEach((value, key, mapp) => {
        resp.cards[key] = value.toString();
    });
    res.end(JSON.stringify(resp));
});
// Call this endpoint to get & "verify" the candidate list before voting.
router.get('/requestballot', function(req, res) {
    let endpoint = constants.authorityEndpoint + constants.voteInformationEndpoint;
    let ret = {};
    rp(endpoint).then(theballot => {
        if (!theballot.authorityKey || !theballot.ballot || !theballot.authoritySignature) {
            res.status(400);
            ret.error = "Missing information in returned ballot.";
            res.end(JSON.stringify(ret));
            return;
        }
        let authorityKey = Buffer.from(theballot.authorityKey, 'utf8');
        let questionsString = Buffer.from(JSON.stringify(theballot.ballot.questions), 'utf8');
        let signature = Buffer.from(theballot.authoritySignature, 'base64');
        // We should verify this, but there's no point unless the authority key is verified through a third channel,
        // which isn't happening in this iteration.
        let expectedKey = req.body['expectedAuthorityKey'];
        if (expectedKey) {
            expectedKey = Buffer.from(expectedKey, 'base64');
            if (Buffer.compare(expectedKey) != 0) {
                ret.warnings = "Received authority key does not match expected authority key.";
            }
        }

        ret.ballot = theballot.ballot;
        res.status(200);
        res.end(JSON.stringify(ret));
    }).catch(e => {
        res.status(400);
        ret.error = e.toString();
        res.end(JSON.stringify(ret));
    });

});

// Call this to begin the process of registering a voter.
// Save the public key and put it into the identity JSON as userKey and userAdminKey
router.post('/extractkeys', function(req, res) {
    let card = req.body['card'];
    card = cardsInserted.get(card);
    let ret = {
    };
    if (!card) {
        res.status(400);
        ret.error = `Card ID ${req.body['card']} doesn't exist.`;
        res.end(JSON.stringify(ret));
        return;
    }
    var usualPublicKey;
    getPublicKey(card, 0).then(function(pkey) {
        usualPublicKey = pkey;
        return getPublicKey(card, 1);
    }).then(function(adminPkey) {
        res.status(200);
        let thePubKey = savePublicKey(usualPublicKey);
        ret.pubkey = thePubKey.toString('base64');

        let theAdminPubKey = savePublicKey(adminPkey);
        ret.adminPubKey = theAdminPubKey.toString('base64');
        res.end(JSON.stringify(ret));
    }).catch(e => {
        res.status(400);
        ret.error = e.toString();
        res.end(JSON.stringify(ret));
        console.log(e);
    });

});

// Given identity, generate & sign X.509 certificate + extra info.
router.post('/registervoter', function(req, res) {
    let identityInformation = req.body["identity"];
    let identitySignature = req.body["userSignature"];
    let identityKey = identityInformation["useKey"];

    let identityAdminSignature = req.body["userAdminSignature"];
    let identityAdminKey = req.body["userAdminKey"];

    let identityString = JSON.stringify(identityInformation);
    let identityBuffer = Buffer.from(identityString, 'utf8');

    let properIdentityKey = parsePublicKeyFromBuffer(Buffer.from(identityKey, 'base64'));
    let properIdentityAdminKey = parsePublicKeyFromBuffer(Buffer.from(identityAdminKey, 'base64'));

    let signatureBuffer = Buffer.from(identitySignature, 'base64');
    let signatureAdminBuffer = Buffer.from(identityAdminSignature, 'base64');

    let ret = {};

    let pin = req.body['pin'];
    if (!pin) {
        res.stauts(400);
        ret.error = "No PIN provided.";
        res.end(JSON.stringify(ret));
        return;
    }
    pin = Buffer.from(pin, 'base64');

    let card = req.body['card'];


    if (!verifySignature(properIdentityKey, identityBuffer, signatureBuffer)
        || !verifySignature(properIdentityAdminKey, identityBuffer, signatureAdminBuffer)) {
        // Invalid signatures! This may be a fake request, or I might've made a bug.
        res.status(400);
        ret.error = "Invalid client signature.";
        res.end(JSON.stringify(ret));
    } else {
        if (cardsInserted.size < 1) {
            res.status(400);
            ret.error = "No smart card detected.";
            res.end(JSON.stringify(ret));
            return;
        } else if (!cardsInserted.get(card)) {
            res.status(400);
            ret.error = `Card with ID ${card} not found.`;
            res.end(JSON.stringify(ret));
            return;
        }
        obtainSignature(cardsInserted.get(card), identityString, pin).then(function(signature) {
            ret.signature = signature.toString('base64');
            ret.identityString = identityString;
            res.status(200);
            res.end(JSON.stringify(ret));
            return;
        }).catch(function(err) {
            ret.error = err;
            res.status(400);
            res.end(JSON.stringify(res));
            return;
        });
    }
});

router.post('/populatecard', function(req, res) {
    let signature = req.body['signature'];
    let identity = req.body['identity'];
    let card = req.body['card'];
    let ret = {};
    if (!signature || !identity || !card) {
        ret.error = "Missing parameter (signature, identity, or card)";
        res.status(400);
        res.end(JSON.stringify(ret));
        return;
    }

    if (!cardsInserted.get(card)) {
        ret.error = `Card ${card} is not inserted`;
        res.status(400);
        res.end(JSON.stringify(ret));
        return;
    }

    identity = Buffer.from(JSON.stringify(identity), 'utf8');
    signature = Buffer.from(signature, 'base64');

    executeWriteToCard(card, identity, 0).then((resp) => {
        return executeWriteToCard(card, signature, 1);
    }).then((resp) => {
        res.status(200);
        ret.message = "Identity and certificate successfully written.";
        res.end(JSON.stringify(ret));
    }).catch((e) => {
        res.status(500);
        ret.error = e.toString();
        res.end(JSON.stringify(ret));
    });
});

router.post('/submitballot', function(req, res) {
    let ballot = req.body['ballot'];
    let ret = {};
    if (!ballot) {
        res.status(400);
        ret.error = 'Missing ballot.';
        res.end(JSON.stringify(ballot));
        return;
    }

    let card = req.body['card'];
    if (!card) {
        res.status(400);
        ret.error = 'Missing card.';
        res.end(JSON.stringify(ret));
        return;
    }
    if (!cardsInserted.get(card)) {
        res.status(400);
        ret.error = `Card ${card} not inserted.`;
        res.end(JSON.stringify(ret));
        return;
    }
    card = cardsInserted.get(card);

    let ballotString = JSON.stringify(ballot);
    let ballotBuffer = Buffer.from(ballotString, 'utf8');
    let randomData = secureRandom(ballotBuffer.length, {type: 'Buffer'});

    // Submit authentication + ballot

    let voteSubmitURI = constants.authorityEndpoint + constants.voteSubmitEndpoint;

    let voteSubmission = {};

    voteSubmission.ballot = ballot;
    voteSubmission.pad = randomData.toString('base64');

    sendAPDU()

    let postObject = {};
    postObject.vote = voteSubmission;
    obtainSignature(card, ballotBuffer, pin).then(signature => {
        postObject.signature = signature.toString('base64');
        return postObject;
    }).then(theRequest => {
        let options = {
            method: 'POST',
            uri: voteSubmitURI,
            body: postObject,
            json: true
        };
        return rp(options);
    }).then(receipt => {
        ret.receipt = receipt;
        res.status(200);
        res.end(JSON.stringify(ret));
    }).catch(e => {
        ret.error = "Error getting signature/submitting vote: "+e;
        res.status(400);
        res.end(JSON.stringify(ret));
    });


});

router.post('/sendapdu', function (req, res) {
    if (req.body['card']) {
        let ret = {};
        let card = cards[res.body['card']];
        if (!res.body['data']) {
            ret.error = 'Missing required attribute data.';
            res.status(400);
            res.end(JSON.stringify(ret));
        }
        if (card) {
            sendAPDU(card, res.body['data']).then(function(responseApdu) {
                res.status(200);
                ret['data'] = responseApdu.buffer.toString('base64');
                res.end(JSON.stringify(ret));
            }).catch(e => {
                res.status(400);
                ret['error'] = `${e}`;
                res.end(JSON.stringify(ret));
            });
        } else {
            res.status(400);
            ret.error = 'Card not inserted.';
            res.end(JSON.stringify(ret));
        }
    } else {
        res.status(400);
        ret.error = 'Missing card.';
        res.end(JSON.stringify(ret));
    }
});

module.exports = router;