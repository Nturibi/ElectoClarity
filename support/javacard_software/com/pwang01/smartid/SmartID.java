/**
 * 
 */
package com.pwang01.smartid;

import javacard.framework.*;
import javacardx.apdu.ExtendedLength;

import javacard.security.*;

/**
 * Applet class
 * 
 * @author <user>
 */
public class SmartID extends Applet implements ExtendedLength {

	private static final byte DATA_WRITE = 1;
	private static final byte UNLOCK_CARD = 2;
	private static final byte LOCK_CARD = 3;
	private static final byte CHANGE_PIN = 4;
	private static final byte READ_DATA = 5;
	private static final byte GENERATE_KEYS = 6;
	private static final byte SIGN_DATA = 7;
	private static final byte ECHO = 8;
	private static final byte READ_KEYS = 9;
	private static final byte ERASE = 10;
	private static final byte ECDSA_VERIFY = 11;

	private static final byte SMARTID_CLA = (byte) 0x24;
	private static final short IDENTITY_LENGTH = 16384;
	private static final short CERTIFICATE_LENGTH = 2048;
	private byte[] identityData = new byte[16384];
	private byte[] certificateData = new byte[2048];

	private KeyPair ECKeyPair;
	private KeyPair secondaryECKeyPair;
	private Signature ecdsa;
	private Signature ecdsaVerify;

	// PINs are 32 bytes long; use a KDF to expand passwords/PINs into PINs for the smart card
	private static final byte PIN_LENGTH = 32;

	private OwnerPIN primaryPIN;
	private OwnerPIN adminPIN;

	private byte[] memoryValues;

	private static final byte[] p_secp192k1 = {
			(byte) 0xFF, (byte) 0xFF, (byte) 0xFF,
			(byte) 0xFF, (byte) 0xFF, (byte) 0xFF,
			(byte) 0xFF, (byte) 0xFF, (byte) 0xFF,
			(byte) 0xFF, (byte) 0xFF, (byte) 0xFF,
			(byte) 0xFF, (byte) 0xFF, (byte) 0xFF,
			(byte) 0xFF, (byte) 0xFF, (byte) 0xFF,
			(byte) 0xFF, (byte) 0xFE, (byte) 0xFF,
			(byte) 0xFF, (byte) 0xEE, (byte) 0x37
	};

	private static final byte[] a_secp192k1 = {
			0x00, 0x00, 0x00,
			0x00, 0x00, 0x00,
			0x00, 0x00, 0x00,
			0x00, 0x00, 0x00,
			0x00, 0x00, 0x00,
			0x00, 0x00, 0x00,
			0x00, 0x00, 0x00,
			0x00, 0x00, 0x00,
	};

	private static final byte[] b_secp192k1 = {
			0x00, 0x00, 0x00,
			0x00, 0x00, 0x00,
			0x00, 0x00, 0x00,
			0x00, 0x00, 0x00,
			0x00, 0x00, 0x00,
			0x00, 0x00, 0x00,
			0x00, 0x00, 0x00,
			0x00, 0x00, 0x03,
	};

	private static final byte[] g_secp192k1 = {
			(byte) 0x04, (byte) 0xDB, (byte) 0x4F,
			(byte) 0xF1, (byte) 0x0E, (byte) 0xC0,
			(byte) 0x57, (byte) 0xE9, (byte) 0xAE,
			(byte) 0x26, (byte) 0xB0, (byte) 0x7D,
			(byte) 0x02, (byte) 0x80, (byte) 0xB7,
			(byte) 0xF4, (byte) 0x34, (byte) 0x1D,
			(byte) 0xA5, (byte) 0xD1, (byte) 0xB1,
			(byte) 0xEA, (byte) 0xE0, (byte) 0x6C,
			(byte) 0x7D, (byte) 0x9B, (byte) 0x2F,
			(byte) 0x2F, (byte) 0x6D, (byte) 0x9C,
			(byte) 0x56, (byte) 0x28, (byte) 0xA7,
			(byte) 0x84, (byte) 0x41, (byte) 0x63,
			(byte) 0xD0, (byte) 0x15, (byte) 0xBE,
			(byte) 0x86, (byte) 0x34, (byte) 0x40,
			(byte) 0x82, (byte) 0xAA, (byte) 0x88,
			(byte) 0xD9, (byte) 0x5E, (byte) 0x2F,
			(byte) 0x9D,
	};

	private static final byte[] n_secp192k1 = {
			(byte) 0xFF, (byte) 0xFF, (byte) 0xFF,
			(byte) 0xFF, (byte) 0xFF, (byte) 0xFF,
			(byte) 0xFF, (byte) 0xFF, (byte) 0xFF,
			(byte) 0xFF, (byte) 0xFF, (byte) 0xFE,
			(byte) 0x26, (byte) 0xF2, (byte) 0xFC,
			(byte) 0x17, (byte) 0x0F, (byte) 0x69,
			(byte) 0x46, (byte) 0x6A, (byte) 0x74,
			(byte) 0xDE, (byte) 0xFD, (byte) 0x8D
	};

	private static final byte[] zeroes = {
			0, 0, 0, 0, 0, 0, 0, 0,
			0, 0, 0, 0, 0, 0, 0, 0,
			0, 0, 0, 0, 0, 0, 0, 0,
			0, 0, 0, 0, 0, 0, 0, 0,
			0, 0, 0, 0, 0, 0, 0, 0,
			0, 0, 0, 0, 0, 0, 0, 0,
			0, 0, 0, 0, 0, 0, 0, 0,
			0, 0, 0, 0, 0, 0, 0, 0,
	};

	private static final short h_secp192k1 = 1;

	/**
	 * Installs this applet.
	 * 
	 * @param bArray
	 *            the array containing installation parameters
	 * @param bOffset
	 *            the starting offset in bArray
	 * @param bLength
	 *            the length in bytes of the parameter data in bArray
	 */
	public static void install(byte[] bArray, short bOffset, byte bLength) {
		new SmartID();
	}

	@Override
	public boolean select() {
		memoryValues = JCSystem.makeTransientByteArray((short) 8, JCSystem.CLEAR_ON_DESELECT);
		return true;
	}

	/**
	 * Only this class's install method should create the applet object.
	 */
	protected SmartID() {
		primaryPIN = new OwnerPIN((byte) 6, PIN_LENGTH);
		adminPIN = new OwnerPIN((byte) 6, PIN_LENGTH);
		byte[] temp = JCSystem.makeTransientByteArray(PIN_LENGTH, JCSystem.CLEAR_ON_DESELECT);
		for (short i = 0; i < PIN_LENGTH; i++) temp[i] = 0;
		primaryPIN.update(temp, (short) 0, PIN_LENGTH);
		adminPIN.update(temp, (short) 0, PIN_LENGTH);
		ecdsa = Signature.getInstance(Signature.ALG_ECDSA_SHA, false);
		regenerateKeys(null);

		register();
		JCSystem.requestObjectDeletion();
	}

	private void initECKey(ECKey eckey) {
		eckey.setA(a_secp192k1, (short) 0, (short) a_secp192k1.length);
		eckey.setFieldFP(p_secp192k1, (short) 0, (short) p_secp192k1.length);
		eckey.setB(b_secp192k1, (short) 0, (short) b_secp192k1.length);
		eckey.setG(g_secp192k1, (short) 0, (short) g_secp192k1.length);
		eckey.setR(n_secp192k1, (short) 0, (short) n_secp192k1.length);
		eckey.setK(h_secp192k1);
	}

	private void regenerateKeys(APDU apdu) {
		try {
			ECPublicKey ecpkey = (ECPublicKey) KeyBuilder.buildKey(KeyBuilder.TYPE_EC_FP_PUBLIC, (short) 192, false);
			initECKey(ecpkey);

			ECPrivateKey ecprkey = (ECPrivateKey) KeyBuilder.buildKey(KeyBuilder.TYPE_EC_FP_PRIVATE, (short) 192, false);
			initECKey(ecprkey);

			ECKeyPair = new KeyPair(ecpkey, ecprkey);
			ECKeyPair.genKeyPair();

			ECPublicKey secondaryECPKey = (ECPublicKey) KeyBuilder.buildKey(KeyBuilder.TYPE_EC_FP_PUBLIC, (short) 192, false);
			initECKey(secondaryECPKey);

			ECPrivateKey secondaryECPrKey = (ECPrivateKey) KeyBuilder.buildKey(KeyBuilder.TYPE_EC_FP_PRIVATE, (short) 192, false);
			initECKey(secondaryECPrKey);

			secondaryECKeyPair = new KeyPair(secondaryECPKey, secondaryECPrKey);
			secondaryECKeyPair.genKeyPair();
		} catch (Exception e) {
			ISOException.throwIt(ISO7816.SW_SECURITY_STATUS_NOT_SATISFIED);
		}
	}

	private short convertToBytes(ECPublicKey pkey, byte[] temp, short offset) {
		short keySize = pkey.getSize();
		keySize = (short) ((short)(keySize + 7) / (short) 8);

		short currentIndex = offset;
		short tmp = 0;

		tmp = pkey.getA(temp, (short) (currentIndex+2));
		Util.setShort(temp, currentIndex, tmp);
		currentIndex += tmp + 2;

		tmp = pkey.getB(temp, (short) (currentIndex+2));
		Util.setShort(temp, currentIndex, tmp);
		currentIndex += tmp + 2;

		tmp = pkey.getField(temp, (short) (currentIndex+2));
		Util.setShort(temp, currentIndex, tmp);
		currentIndex += tmp + 2;

		tmp = pkey.getG(temp, (short) (currentIndex+2));
		Util.setShort(temp, currentIndex, tmp);
		currentIndex += tmp + 2;

		Util.setShort(temp, currentIndex, (short) 2);
		Util.setShort(temp, (short) (currentIndex+2), pkey.getK());
		currentIndex += 4;

		tmp = pkey.getR(temp, (short) (currentIndex+2));
		Util.setShort(temp, currentIndex, tmp);
		currentIndex += tmp + 2;

		tmp = pkey.getW(temp, (short) (currentIndex+2));
		Util.setShort(temp, currentIndex, tmp);
		currentIndex += tmp + 2;

		return (short) (currentIndex - offset);
	}

	private void readKeys(APDU apdu) {
		byte[] buffer = apdu.getBuffer();
		KeyPair kp = null;
		switch (buffer[ISO7816.OFFSET_P1]) {
		case 0:
			kp = ECKeyPair;
			break;
		case 1:
			kp = secondaryECKeyPair;
			break;
		default:
			ISOException.throwIt(ISO7816.SW_WRONG_P1P2);
			return;
		}
		short og = apdu.setOutgoing();
		short numBytes = convertToBytes((ECPublicKey) kp.getPublic(), buffer, (short) 0);
		if (numBytes > og) {
			ISOException.throwIt(ISO7816.SW_WRONG_LENGTH);
			return;
		}

		apdu.setOutgoingLength(numBytes);
		apdu.sendBytes((short) 0, numBytes);
	}

	private void readData(APDU apdu) {
		byte[] buffer = apdu.getBuffer();
		byte[] bufferToReadFrom = null;
		short lengthOfBuffer = -1;
		switch (buffer[ISO7816.OFFSET_P1]) {
		case 0:
			bufferToReadFrom = identityData;
			lengthOfBuffer = IDENTITY_LENGTH;
			break;
		case 1:
			bufferToReadFrom = certificateData;
			lengthOfBuffer = CERTIFICATE_LENGTH;
			break;
		default:
			ISOException.throwIt(ISO7816.SW_WRONG_P1P2);
			return;
		}
		short len = apdu.setOutgoing();
		if (len < lengthOfBuffer) {
			ISOException.throwIt(ISO7816.SW_WRONG_LENGTH);
			return;
		}
		apdu.setOutgoingLength(lengthOfBuffer);
		Util.arrayCopy(bufferToReadFrom, (short) 0, buffer, (short) 0, lengthOfBuffer);
		apdu.sendBytes((short) 0, lengthOfBuffer);
	}

	private void writeData(APDU apdu) {
		short len = apdu.getIncomingLength();
		byte[] buffer = apdu.getBuffer();
		byte[] dest = null;
		switch (buffer[ISO7816.OFFSET_P1]) {
		case 0:
			dest = identityData;
			break;
		case 1:
			dest = certificateData;
			break;
		default:
			ISOException.throwIt(ISO7816.SW_INCORRECT_P1P2);
		}

		Util.arrayCopy(buffer, ISO7816.OFFSET_EXT_CDATA, dest, buffer[ISO7816.OFFSET_P2], len);

	}

	private void lock(APDU apdu) {
		primaryPIN.reset();
		adminPIN.reset();
	}

	private void unlock(APDU apdu) {
		byte[] buffer = apdu.getBuffer();
		short incomingLength = apdu.setIncomingAndReceive();
		boolean success = incomingLength == PIN_LENGTH
				&& primaryPIN.check(buffer, ISO7816.OFFSET_CDATA, PIN_LENGTH);
		if (!success) {
			ISOException.throwIt(ISO7816.SW_WRONG_DATA);
		}
	}

	private boolean checkAdministrativePIN(APDU apdu) {
		byte[] buffer = apdu.getBuffer();
		boolean ret = adminPIN.check(buffer, ISO7816.OFFSET_CDATA, PIN_LENGTH);
		adminPIN.reset();
		return ret;
	}

	private void signData(APDU apdu) {
		APDU.waitExtension();
		JCSystem.requestObjectDeletion();
		byte[] buffer = apdu.getBuffer();
		KeyPair kp = null;
		short bufferOffset = (short) ISO7816.OFFSET_CDATA;
		short dataLength = apdu.getIncomingLength();
		switch (buffer[ISO7816.OFFSET_P1]) {
		case 0:
			kp = ECKeyPair;
			break;
		case 1:
			kp = secondaryECKeyPair;
			if (!checkAdministrativePIN(apdu)) {
				ISOException.throwIt(ISO7816.SW_WRONG_DATA);
				return;
			}
			bufferOffset += PIN_LENGTH;
			dataLength -= PIN_LENGTH;
			break;
		default:
			ISOException.throwIt(ISO7816.SW_WRONG_P1P2);
			break;
		}
		short signatureLength = -1;

		byte[] sigBuffer = JCSystem.makeTransientByteArray((short) 2, JCSystem.CLEAR_ON_DESELECT);
		boolean success = false;
		short responseLength = 0;
		try {
			ecdsa.init(kp.getPrivate(), Signature.MODE_SIGN);		
			signatureLength = ecdsa.sign(buffer, bufferOffset, dataLength, buffer, (short) 0);
			success = true;
		} catch (CryptoException e) {
			sigBuffer[0] = (byte) 0xE7;
			sigBuffer[1] = (byte) e.getReason();
			responseLength = 2;
			ISOException.throwIt(ISO7816.SW_WRONG_DATA);
		} catch (SystemException se) {
			sigBuffer[0] = (byte) 0xEF;
			sigBuffer[1] = (byte) se.getReason();
			responseLength = 2;
			ISOException.throwIt(ISO7816.SW_WRONG_DATA);
		} catch (NullPointerException ne) {
			sigBuffer[0] = (byte) 0xEE;
			responseLength = 1;
			ISOException.throwIt(ISO7816.SW_WRONG_DATA);
		} catch (CardRuntimeException cre) {
			sigBuffer[0] = (byte) 0xED;
			sigBuffer[1] = (byte) cre.getReason();
			responseLength = 2;
			ISOException.throwIt(ISO7816.SW_WRONG_DATA);
		} catch (ArithmeticException ae) {
			sigBuffer[0] = (byte) 0xEC;
			responseLength = 1;
			ISOException.throwIt(ISO7816.SW_WRONG_DATA);
		} catch (ArrayIndexOutOfBoundsException aie) {
			sigBuffer[0] = (byte) 0xEB;
			responseLength = 1;
			ISOException.throwIt(ISO7816.SW_WRONG_DATA);
		} catch (ArrayStoreException ase) {
			sigBuffer[0] = (byte) 0xEA;
			responseLength = 1;
			ISOException.throwIt(ISO7816.SW_WRONG_DATA);
		} catch (ClassCastException cce) {
			sigBuffer[0] = (byte) 0xEA;
			responseLength = 1;
			ISOException.throwIt(ISO7816.SW_WRONG_DATA);
		} catch (RuntimeException re) {
			sigBuffer[0] = (byte) 0xE9;
			responseLength = 1;
			ISOException.throwIt(ISO7816.SW_WRONG_DATA);
		} catch (Exception ex) {
			sigBuffer[0] = (byte) 0xE8;
			responseLength = 1;
			ISOException.throwIt(ISO7816.SW_WRONG_DATA);
		}
		if (!success) {
			apdu.setOutgoingLength(responseLength);
			apdu.sendBytesLong(sigBuffer, (short) 0, responseLength);
		} else {
			short og = apdu.setOutgoing();
			if (og < signatureLength) {
				ISOException.throwIt(ISO7816.SW_WRONG_LENGTH);
				return;
			}
			apdu.setOutgoingLength(signatureLength);
			apdu.sendBytes((short) 0, signatureLength);
		}
		JCSystem.requestObjectDeletion();
	}

	private void echo(APDU apdu) {
		short bytesToReceive = apdu.setIncomingAndReceive();
		byte[] buffer = apdu.getBuffer();


		short offset = bytesToReceive <= 255 ? ISO7816.OFFSET_CDATA : ISO7816.OFFSET_EXT_CDATA;
		short og = apdu.setOutgoing();
		if (og < bytesToReceive) {
			ISOException.throwIt(ISO7816.SW_WRONG_LENGTH);
			return;
		}

		apdu.setOutgoingLength(bytesToReceive);
		apdu.sendBytes(offset, bytesToReceive);
	}

	private void changePIN(APDU apdu) {
		byte[] buffer = apdu.getBuffer();
		if (adminPIN.check(buffer, ISO7816.OFFSET_CDATA, PIN_LENGTH)) {
			OwnerPIN pinToUpdate = null;
			switch (buffer[ISO7816.OFFSET_P1]) {
			case 0:
				pinToUpdate = primaryPIN;
				break;
			case 1:
				pinToUpdate = adminPIN;
				break;
			default:
				ISOException.throwIt(ISO7816.SW_WRONG_P1P2);
				return;
			}
			pinToUpdate.update(buffer, (short) ((short) ISO7816.OFFSET_CDATA+(short) PIN_LENGTH), PIN_LENGTH);
		} else {
			ISOException.throwIt(ISO7816.SW_WRONG_DATA);
		}
	}
	
	private void verifySignature(APDU apdu) {
		byte[] buffer = apdu.getBuffer();
		byte pubKeyLength = buffer[ISO7816.OFFSET_P1];
		byte signatureLength = buffer[ISO7816.OFFSET_P2];
		short incomingLength = apdu.getIncomingLength();
		
		short keyLength = Util.getShort(buffer, (short) 0);
		
		
		ECPublicKey ecpk = (ECPublicKey) KeyBuilder.buildKey(KeyBuilder.TYPE_EC_FP_PUBLIC, keyLength, false);
		initECKey(ecpk);
		ecpk.setW(buffer, (short) 0, pubKeyLength);
		
		Signature verifySignature = Signature.getInstance(Signature.ALG_ECDSA_SHA, false);
		verifySignature.init(ecpk, Signature.MODE_VERIFY);
		boolean verified = verifySignature.verify(buffer, (short) (pubKeyLength+signatureLength),
				(short)(incomingLength - (pubKeyLength+signatureLength)), buffer, pubKeyLength, signatureLength);
		if (!verified) {
			ISOException.throwIt(ISO7816.SW_DATA_INVALID);
		}
	}
	
	private void erase(APDU apdu) {
		regenerateKeys(apdu);
		Util.arrayFillNonAtomic(certificateData, (short) 0, CERTIFICATE_LENGTH, (byte) 0);
		Util.arrayFillNonAtomic(identityData, (short) 0, IDENTITY_LENGTH, (byte) 0);
		primaryPIN.update(zeroes, (short) 0, PIN_LENGTH);
		adminPIN.update(zeroes, (short) 0, PIN_LENGTH);
		primaryPIN.resetAndUnblock();
		adminPIN.resetAndUnblock();
	}

	/**
	 * Processes an incoming APDU.
	 * 
	 * @see APDU
	 * @param apdu
	 *            the incoming APDU
	 */
	@Override
	public void process(APDU apdu) {
		byte[] buffer = apdu.getBuffer();
		if (selectingApplet()) return;

		if (buffer[ISO7816.OFFSET_CLA] == 0) {
			return;
		}
		if (buffer[ISO7816.OFFSET_CLA] != SMARTID_CLA) {
			ISOException.throwIt(ISO7816.SW_CLA_NOT_SUPPORTED);
			return;
		}

		// Authentication not required
		switch (buffer[ISO7816.OFFSET_INS]) {
		case ECHO:
			echo(apdu);
			return;
		case UNLOCK_CARD:
			unlock(apdu);
			return;
		case READ_KEYS:
			readKeys(apdu);
			return;
			// Use to reuse a permanently locked card
		case ERASE:
			erase(apdu);
			return;
		case ECDSA_VERIFY:
			apdu.setIncomingAndReceive();
			verifySignature(apdu);
			return;
		}

		if (!primaryPIN.isValidated()) {
			ISOException.throwIt(ISO7816.SW_CONDITIONS_NOT_SATISFIED);
			return;
		}

		// Authentication required

		switch (buffer[ISO7816.OFFSET_INS]) {
		case LOCK_CARD:
			JCSystem.beginTransaction();
			lock(apdu);
			JCSystem.commitTransaction();
			break;
		case DATA_WRITE:
			JCSystem.beginTransaction();
			apdu.setIncomingAndReceive();
			writeData(apdu);
			JCSystem.commitTransaction();
			break;
		case CHANGE_PIN:
			JCSystem.beginTransaction();
			apdu.setIncomingAndReceive();
			changePIN(apdu);
			JCSystem.commitTransaction();
			break;
		case READ_DATA:
			readData(apdu);
			break;
		case GENERATE_KEYS:
			JCSystem.beginTransaction();
			regenerateKeys(apdu);
			JCSystem.commitTransaction();
			break;
		case SIGN_DATA:
			apdu.setIncomingAndReceive();
			signData(apdu);
		default:
			ISOException.throwIt(ISO7816.SW_INS_NOT_SUPPORTED);
			return;
		}

	}
}
