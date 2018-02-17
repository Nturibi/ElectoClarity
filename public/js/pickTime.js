/*takes in a container for the hour, minute, the minutes range and am/pm container*/
function timePicker(hElems, mElems, minuteRange, pElems){
	const hours =[];
	for (let i = 1; i <= 12; i++){
		let num = i;
		if  ( i < 10){

			num = "0"+i;
		}
		hours.push(num);
	}
		
	const minutes = [];
	for (let j = 0; j <= (60-minuteRange) ; j += minuteRange){
		let num = j;
		if  ( j < 10){
			num = "0"+j;
		}
		minutes.push(num);
	}
	const amOrPm = ["AM", "PM"];
	tagAndAppend(hElems, hours);
	tagAndAppend(mElems, minutes);
	tagAndAppend(pElems, amOrPm);
}
/*Creates tags and appends the tags to the container element */
function tagAndAppend(cElems, arr){
	const allElems = [];
	for (let i = 0; i < arr.length; i++){
		let elem = "<option>"+arr[i]+"</option>";
		allElems.push(elem);
	}
	for (let elem of cElems){
		elem.innerHTML = allElems;
	}
}
