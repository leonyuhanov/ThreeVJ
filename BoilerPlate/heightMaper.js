//Height Mapping like pixel mapping but with a single colour value
class heightMaper
{
	constructor(cols, rows)
	{
		this.heightMapArray = new Array();
		this.cols = cols;
		this.rows = rows;
		this.colCounter = 0;
		this.rowCounter = 0;
		this.tempRow = new Array();
		
		for(this.rowCounter=0; this.rowCounter<this.rows; this.rowCounter++)
		{
			this.tempRow = new Array();			
			for(this.colCounter=0; this.colCounter<this.cols; this.colCounter++)
			{
				this.tempRow.push(0);
			}
			this.heightMapArray.push(this.tempRow);
		}
	}
	drawPixel = function(x, y, heightValue)
	{
		if(x<this.cols && y<this.rows && x>=0 && y>=0)
		{
			this.heightMapArray[y][x] = heightValue;
		}
	}
	drawLine = function(x0, y0, x1, y1, heightValue)
	{
	   var dx = Math.abs(x1-x0);
	   var dy = Math.abs(y1-y0);
	   var sx = (x0 < x1) ? 1 : -1;
	   var sy = (y0 < y1) ? 1 : -1;
	   var err = dx-dy;

	   while(true)
	   {
		 this.drawPixel(x0, y0, heightValue);
		 if ((x0==x1) && (y0==y1)) break;
		 var e2 = 2*err;
		 if (e2 >-dy){ err -= dy; x0  += sx; }
		 if (e2 < dx){ err += dx; y0  += sy; }
	   }
	}
	renderHLine = function(x,y,length,heightValue)
	{
		var xCnt = 0;
		if(xCnt+length<=this.cols)
		{
			for(xCnt=x; xCnt<x+length; xCnt++)
			{
				this.drawPixel(xCnt, y, heightValue);
			}
		}
	}
	renderVLine = function(x,y,length, heightValue)
	{
		var yCnt = 0;
		if(y+length<=this.rows)
		{
			for(yCnt=y; yCnt<y+length; yCnt++)
			{
				this.drawPixel(x, yCnt, heightValue);
			}
		}
	}
	renderRecetangle = function(x, width, y, height, heightValue)
	{
		this.renderHLine(x, y, width, heightValue);
		this.renderHLine(x, y+height, width, heightValue);
		this.renderVLine(x, y, height, heightValue);
		this.renderVLine(x+width, y, height, heightValue);
	}
	renderPolly = function(x, y, radius, numberOfPoints, heightValue)
	{
		var pointCounter;
		var startPoints = [0,0];
		var endPoints = [0,0];
		for(pointCounter=0; pointCounter<numberOfPoints; pointCounter++)
		{
			startPoints = this.getElipticalPointsRaw(x, y, radius, radius, (360/numberOfPoints)*pointCounter);
			if(pointCounter+1<numberOfPoints)
			{
				endPoints = this.getElipticalPointsRaw(x, y, radius, radius, (360/numberOfPoints)*(pointCounter+1));
			}
			else
			{
				endPoints = this.getElipticalPointsRaw(x, y, radius, radius, 0);
			}
			this.drawLine(startPoints[0], startPoints[1], endPoints[0], endPoints[1], heightValue);
		}
	}
	fill = function(xStart, yStart, width, height, heightValue)
	{
		var xp, yp;
		for(xp=xStart; xp<xStart+width; xp++)
		{
			for(yp=yStart; yp<yStart+height; yp++)
			{
				this.drawPixel(xp, yp, heightValue);
			}
		}
	}
	drawCircle = function(cX, cY, radius, heightValue, degreePointIncrement)
	{
		var degCounter = 0;
		var cPoints = [0,0];
		for(degCounter=0; degCounter<360; degCounter+=degreePointIncrement)
		{
			cPoints = this.getElipticalPointsRaw(cX, cY, radius, radius, degCounter);
			this.drawPixel(Math.round(cPoints[0]), Math.round(cPoints[1]), heightValue);
		}
	}
	gradiatedPoint = function(cX, cY, peakRadius, peakValue, fadeBy)
	{
		var radCounter=0;
		var tempValue = peakValue;
		
		for(radCounter=0; radCounter<peakRadius; radCounter++)
		{
			this.drawCircle(cX, cY, radCounter, peakValue, 1);
		}
		tempValue = this.singleSubtractiveFade(tempValue, fadeBy);
		while(tempValue>0)
		{
			this.drawCircle(cX, cY, radCounter, tempValue, 1);
			radCounter++;
			tempValue = this.singleSubtractiveFade(tempValue, fadeBy);
		}
		
	}
	getCircularPoints = function(circleX, circleY, circleR, angleFromTopLeftoRight)
	{
		var circCoOrds = [0, 0];
		angleFromTopLeftoRight+=180;
		circCoOrds[0] = circleX + Math.sin(angleFromTopLeftoRight*(Math.PI / 180))*circleR;
		circCoOrds[1] = circleY - Math.cos(angleFromTopLeftoRight*(Math.PI / 180))*circleR;
		circCoOrds[0] = Math.round((circCoOrds[0] + Number.EPSILON) * 100) / 100;
		circCoOrds[1] = Math.round((circCoOrds[1] + Number.EPSILON) * 100) / 100;		
		return circCoOrds;
	}
	
	getCircularPointsRaw = function(circleX, circleY, circleR, angleFromTopLeftoRight)
	{
		var circCoOrds = [0, 0];
		circCoOrds[0] = circleX + Math.sin(angleFromTopLeftoRight*(Math.PI / 180))*circleR;
		circCoOrds[1] = circleY - Math.cos(angleFromTopLeftoRight*(Math.PI / 180))*circleR;
		return circCoOrds;
	}
	getElipticalPointsRaw = function(circleX, circleY, width, height, angleFromTopLeftoRight)
	{
		var circCoOrds = [0, 0];
		circCoOrds[0] = circleX + Math.sin(angleFromTopLeftoRight*(Math.PI / 180))*width ;
		circCoOrds[1] = circleY - Math.cos(angleFromTopLeftoRight*(Math.PI / 180))*height;
		return circCoOrds;
	}
	subtractiveFade = function(fadeLevel)
	{
		var xCnt=0, yCnt=0;
		
		for(yCnt=0; yCnt<this.rows; yCnt++)
		{
			for(xCnt=0; xCnt<this.cols; xCnt++)
			{
				if(this.heightMapArray[yCnt][xCnt]-fadeLevel<0){ this.heightMapArray[yCnt][xCnt]=0; }
				else{this.heightMapArray[yCnt][xCnt]-=fadeLevel;}
			}
		}
	}
	singleSubtractiveFade = function(currentValue, fadeBy)
	{
		if(currentValue-fadeBy<0)
		{
			currentValue = 0;
		}
		else
		{
			currentValue -= fadeBy;
		}
		return currentValue;
	}
	clear = function()
	{
		var xCnt=0, yCnt=0;
		for(yCnt=0; yCnt<this.rows; yCnt++)
		{
			for(xCnt=0; xCnt<this.cols; xCnt++)
			{
				this.heightMapArray[yCnt][xCnt] = 0;
			}
		}
	}
	
	shiftUpDown = function(limitArray, direction, wrap)
	{
		var xCnt=0, yCnt=0;
		var tempBlock = new Array();
		
		if(limitArray==undefined)
		{
			var limitArray = [0,this.cols, 0, this.rows];
		}
		
		if(direction=="down")
		{
			//copy the last row if wrap is defined
			if(wrap)
			{
				for(xCnt=0; xCnt<this.cols; xCnt++)
				{
					tempBlock.push( this.heightMapArray[limitArray[3]-1][xCnt] );
				}
			}
			//start at the end, copy next row into the current
			for(yCnt=limitArray[3]; yCnt>limitArray[2]; yCnt--)
			{
				for(xCnt=limitArray[0]; xCnt<limitArray[1]; xCnt++)
				{
					this.heightMapArray[yCnt][xCnt] = this.heightMapArray[yCnt-1][xCnt];
				}
			}
			//copy the last row into the 1st row if wrap is defines
			if(wrap)
			{
				for(xCnt=0; xCnt<this.cols; xCnt++)
				{
					this.heightMapArray[limitArray[2]][xCnt] = tempBlock[xCnt];
				}
			}
		}
		else
		{
			//copy the 1st row
			if(wrap)
			{
				for(xCnt=0; xCnt<this.cols; xCnt++)
				{
					tempBlock.push( this.heightMapArray[limitArray[2]][xCnt] );
				}
			}
			//start at the top, copy next row into the current
			for(yCnt=limitArray[2]; yCnt<limitArray[3]; yCnt++)
			{
				for(xCnt=limitArray[0]; xCnt<limitArray[1]; xCnt++)
				{
					this.heightMapArray[yCnt][xCnt] = this.heightMapArray[yCnt+1][xCnt];
				}
			}		
			//copy the 1st row into the last row
			if(wrap)
			{
				for(xCnt=0; xCnt<this.cols; xCnt++)
				{
					this.heightMapArray[limitArray[3]][xCnt] = tempBlock[xCnt];
				}
			}
		}
	}
	
	shiftLeftRight = function(limitArray, direction, wrap)
	{
		var xCnt=0, yCnt=0;
		var tempBlock = new Array();

		if(limitArray==undefined)
		{
			var limitArray = [0,this.cols, 0, this.rows];
		}
		
		if(direction=="right")
		{
			//copy the last column
			if(wrap)
			{
				for(yCnt=0; yCnt<this.rows; yCnt++)
				{
					tempBlock.push( this.heightMapArray[yCnt][this.cols-1] );
				}
			}
			//start at the end, copy next row into the current
			for(xCnt=limitArray[1]-1; xCnt>limitArray[0]; xCnt--)
			{
				for(yCnt=limitArray[2]; yCnt<limitArray[3]; yCnt++)
				{
					this.heightMapArray[yCnt][xCnt] = this.heightMapArray[yCnt][xCnt-1];
				}
			}
			//copy the last column into the 1st column
			if(wrap)
			{
				for(yCnt=0; yCnt<this.rows; yCnt++)
				{
					this.heightMapArray[yCnt][0] = tempBlock[yCnt];
				}
			}
		}
		else
		{
			//copy the 1st column
			if(wrap)
			{
				for(yCnt=0; yCnt<this.rows; yCnt++)
				{
					tempBlock.push( this.heightMapArray[yCnt][0] );
				}
			}	
			//start at the end, copy next row into the current
			for(xCnt=limitArray[0]; xCnt<limitArray[1]-1; xCnt++)
			{
				for(yCnt=limitArray[2]; yCnt<limitArray[3]; yCnt++)
				{
					this.heightMapArray[yCnt][xCnt] = this.heightMapArray[yCnt][xCnt+1];
				}
			}
			//copy the 1st column into the last column
			if(wrap)
			{
				for(yCnt=0; yCnt<this.rows; yCnt++)
				{
					this.heightMapArray[yCnt][this.cols-1] = tempBlock[yCnt];
				}
			}
		}
	}
	heightAt = function(x, y)
	{
		return this.heightMapArray[y][x];
	}
	hasHeight = function(x, y)
	{
		if( this.heightMapArray[y][x]>0 )
		{
			return 1;
		}
		else
		{
			return 0;
		}
	}
}
export default heightMaper;
