//console.log("starting up!!

class Singleton {
	constructor(){
		this.homeData;

	}

	getHomeData(){
		return this.homeData;
	}
	static setHomeData(obj){
		this.homeData = obj;
	}


}
