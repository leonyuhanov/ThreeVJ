class ElipticalEnvelopGenerator
{	
	constructor()
	{
		this.envelopArray = new Array();
		this.numberOfItems=0;
		this.genCounter=0;
		this.timeCounter=0;
		this.currentIndex=0;
		this.timeTracker=0;
		/*singleshot 
			0 = Infinite LFO
			1 = One SHot Stop at end of time index
			2 = Shot finished, Do not run
		*/
	}
	
	add =  function(envelopName, pointArray, durationArray, singleShot)
	{
		this.envelopArray.push([envelopName, pointArray, durationArray, singleShot, 0, 0]);
		//set total number of steps for envelop
		this.currentIndex = this.getEnvelopIndex(envelopName);
		this.envelopArray[this.currentIndex][5] = this.getTotalRunTime(envelopName);
		//sets the global array counter
		this.numberOfItems = this.envelopArray.length;
	}
	addWithTimeCode =  function(envelopName, pointArray, durationArray, singleShot, timeCodeIndex)
	{
		this.add(envelopName, pointArray, durationArray, singleShot);
		this.setTimeCode(envelopName, timeCodeIndex);
	}
	remove = function(envelopName)
	{
		var envelopIndex = this.getEnvelopIndex(envelopName);
		if(envelopIndex!=-1)
		{
			this.envelopArray.splice(envelopIndex,1);
			this.numberOfItems--;
		}
	}
	read = function(envelopName, increment, timeCode)
	{
		var currentBlock=0, blockIndex=0, timeCodeTotal = 0, timeCodeToSubtract=0, angleIndex=0;
		var points = [0,0];
		
		//Find the envelop in the array via its name
		this.currentIndex = this.getEnvelopIndex(envelopName);
		//Check if one shot is complete
		if(this.envelopArray[this.currentIndex][3]==2)
		{
			return 0;
		}
		//check One shot state
		else if(this.envelopArray[this.currentIndex][3]==1)
		{
			if(increment!=0)
			{
				if(this.envelopArray[this.currentIndex][4]+increment>=this.envelopArray[this.currentIndex][5])
				{
					//set one shot state to complete
					this.envelopArray[this.currentIndex][3] = 2;
					//reset time index to 0
					this.envelopArray[this.currentIndex][4] = 0;
					return 0;
				}
			}
			else
			{
				if(this.envelopArray[this.currentIndex][4]+timeCode>=this.envelopArray[this.currentIndex][5])
				{
					//set one shot state to complete
					this.envelopArray[this.currentIndex][3] = 2;
					//reset time index to 0
					this.envelopArray[this.currentIndex][4] = 0;
					return 0;
				}
			}
		}
		//increment the steps for this envelop if "increment" is NOT 0 otherwise use timeCode
		if(increment!=0)
		{
			this.envelopArray[this.currentIndex][4] = (this.envelopArray[this.currentIndex][4]+increment)%this.envelopArray[this.currentIndex][5];
		}
		else
		{
			this.envelopArray[this.currentIndex][4] = timeCode%this.envelopArray[this.currentIndex][5];
		}
		
		//locate which block of the envelop we are in
		for(blockIndex=0; blockIndex<this.envelopArray[this.currentIndex][2].length; blockIndex++)
		{
			timeCodeTotal += this.envelopArray[this.currentIndex][2][blockIndex]
			if(this.envelopArray[this.currentIndex][4]<timeCodeTotal)
			{
				timeCodeToSubtract = timeCodeTotal-this.envelopArray[this.currentIndex][2][blockIndex];
				break;
			}
		}
		//blockIndex is now the block we need to calculate within
		timeCodeTotal = this.envelopArray[this.currentIndex][4]-timeCodeToSubtract;
		angleIndex = (timeCodeTotal/this.envelopArray[this.currentIndex][2][blockIndex])*180;
		points = this.getElipticalPointsRaw(0, 0, this.envelopArray[this.currentIndex][1][blockIndex], this.envelopArray[this.currentIndex][2][blockIndex], angleIndex)
		//points[0] is our LFO reading
		return points[0];
	}
	setTimeCode = function(envelopName, timeCodeIndex)
	{
		this.currentIndex = this.getEnvelopIndex(envelopName);
		this.envelopArray[this.currentIndex][4] = timeCodeIndex%this.envelopArray[this.currentIndex][5];
	}
	getTimeCode = function(envelopName)
	{
		this.currentIndex = this.getEnvelopIndex(envelopName);
		return this.envelopArray[this.currentIndex][4];
	}
	getTotalRunTime = function(envelopName)
	{
		var totalRunTime=0;
		this.currentIndex = this.getEnvelopIndex(envelopName);
		for(this.genCounter=0; this.genCounter<this.envelopArray[ this.currentIndex ][2].length; this.genCounter++)
		{
			totalRunTime += this.envelopArray[ this.currentIndex ][2][this.genCounter];
		}
		return totalRunTime;
	}
	getElipticalPointsRaw = function(circleX, circleY, width, height, angleFromTopLeftoRight)
	{
		var circCoOrds = [0, 0];
		circCoOrds[0] = circleX + Math.sin(angleFromTopLeftoRight*(Math.PI / 180))*width ;
		circCoOrds[1] = circleY - Math.cos(angleFromTopLeftoRight*(Math.PI / 180))*height;
		return circCoOrds;
	}
	getEnvelopIndex = function(envelopName)
	{
		for(this.genCounter=0; this.genCounter<this.envelopArray.length; this.genCounter++)
		{
			if(this.envelopArray[this.genCounter][0] == envelopName)
			{
				return this.genCounter;
			}
		}
		return -1;
	}
	isHalfWay = function(envelopName)
	{
		if( this.getTimeCode(envelopName)>=(this.getTotalRunTime(envelopName)/2) )
		{
			return 1;
		}
		return 0;
	}
	setOneShotState = function(envelopName, state, timeIndex)
	{
		this.currentIndex = this.getEnvelopIndex(envelopName);
		this.envelopArray[this.currentIndex][3] = state;
		this.envelopArray[this.currentIndex][4] = timeIndex;
	}
	getOneShotState = function(envelopName)
	{
		this.currentIndex = this.getEnvelopIndex(envelopName);
		return this.envelopArray[this.currentIndex][3];
	}
}
export default ElipticalEnvelopGenerator;