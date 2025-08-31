class pixelMaper
{
	constructor(cols, rows)
	{
		this.bitmapArray = new Array();
		this.cols = cols;
		this.rows = rows;
		this.colCounter = 0;
		this.rowCounter = 0;
		this.tempRow = new Array();
		this.boxDimensions = [1,1,1];
		this.mapLocation = [0,0];
		this.spacing = 1;
		
		for(this.rowCounter=0; this.rowCounter<this.rows; this.rowCounter++)
		{
			this.tempRow = new Array();			
			for(this.colCounter=0; this.colCounter<this.cols; this.colCounter++)
			{
				this.tempRow.push([0,0,0]);
			}
			this.bitmapArray.push(this.tempRow);
		}
	}
	drawPixel = function(x, y, pixColour)
	{
		if(x<this.cols && y<this.rows && x>=0 && y>=0)
		{
			this.bitmapArray[y][x][0] = pixColour[0];
			this.bitmapArray[y][x][1] = pixColour[1];
			this.bitmapArray[y][x][2] = pixColour[2];
		}
	}
	drawLine = function(x0, y0, x1, y1, pixelColour)
	{
	   var dx = Math.abs(x1-x0);
	   var dy = Math.abs(y1-y0);
	   var sx = (x0 < x1) ? 1 : -1;
	   var sy = (y0 < y1) ? 1 : -1;
	   var err = dx-dy;

	   while(true)
	   {
		 this.drawPixel(x0, y0, pixelColour);
		 if ((x0==x1) && (y0==y1)) break;
		 var e2 = 2*err;
		 if (e2 >-dy){ err -= dy; x0  += sx; }
		 if (e2 < dx){ err += dx; y0  += sy; }
	   }
	}
	renderHLine = function(x,y,length,pixColour)
	{
		var xCnt = 0;
		if(xCnt+length<=this.cols)
		{
			for(xCnt=x; xCnt<x+length; xCnt++)
			{
				this.drawPixel(xCnt, y, pixColour);
			}
		}
	}
	renderVLine = function(x,y,length, pixColour)
	{
		var yCnt = 0;
		if(y+length<=this.rows)
		{
			for(yCnt=y; yCnt<y+length; yCnt++)
			{
				this.drawPixel(x, yCnt, pixColour);
			}
		}
	}
	renderRecetangle = function(x, width, y, height, pixColour)
	{
		this.renderHLine(x, y, width, pixColour);
		this.renderHLine(x, y+height, width, pixColour);
		this.renderVLine(x, y, height, pixColour);
		this.renderVLine(x+width, y, height, pixColour);
	}
	renderPolly = function(x, y, radius, numberOfPoints, pixColour)
	{
		var pointCounter;
		var startPoints = [0,0];
		var endPoints = [0,0];
		for(pointCounter=0; pointCounter<numberOfPoints; pointCounter++)
		{
			startPoints = this.getCircularPoints(x, y, radius, (360/numberOfPoints)*pointCounter);
			if(pointCounter+1<numberOfPoints)
			{
				endPoints = this.getCircularPoints(x, y, radius, (360/numberOfPoints)*(pointCounter+1));
			}
			else
			{
				endPoints = this.getCircularPoints(x, y, radius, 0);
			}
			this.drawLine(startPoints[0], startPoints[1], endPoints[0], endPoints[1], pixColour);
		}
	}
	fill = function(xStart, yStart, width, height, pixColour)
	{
		var xp, yp;
		for(xp=xStart; xp<xStart+width; xp++)
		{
			for(yp=yStart; yp<yStart+height; yp++)
			{
				this.drawPixel(xp, yp, pixColour);
			}
		}
	}
	drawCircle = function(cX, cY, radius, pixColour, degreePointIncrement)
	{
		var degCounter = 0;
		var cPoints = [0,0];
		for(degCounter=0; degCounter<360; degCounter+=degreePointIncrement)
		{
			cPoints = this.getCircularPoints(cX, cY, radius, degCounter);
			this.drawPixel(Math.round(cPoints[0]), Math.round(cPoints[1]), pixColour);
		}
	}
	gradiatedPoint = function(cX, cY, peakRadius, peakColour, fadeBy)
	{
		var radCounter=0;
		var tempColour = [peakColour[0], peakColour[1], peakColour[2]];
		
		for(radCounter=0; radCounter<peakRadius; radCounter++)
		{
			this.drawCircle(cX, cY, radCounter, peakColour, 1);
		}
		tempColour = this.singleSubtractiveFade(tempColour, fadeBy);
		while(tempColour[0]>0 || tempColour[1]>0 || tempColour[2]>0)
		{
			this.drawCircle(cX, cY, radCounter, tempColour, 1);
			radCounter++;
			tempColour = this.singleSubtractiveFade(tempColour, fadeBy);
		}
		
	}
	getCircularPoints = function(circleX, circleY, circleR, angleFromTopLeftoRight)
	{
		var circCoOrds = [0, 0];
		angleFromTopLeftoRight+=180;
		circCoOrds[0] = circleX + Math.sin(angleFromTopLeftoRight*(Math.PI / 180))*circleR ;
		circCoOrds[1] = circleY - Math.cos(angleFromTopLeftoRight*(Math.PI / 180))*circleR;
		circCoOrds[0] = Math.round((circCoOrds[0] + Number.EPSILON) * 100) / 100;
		circCoOrds[1] = Math.round((circCoOrds[1] + Number.EPSILON) * 100) / 100;		
		return circCoOrds;
	}
	
	getCircularPointsRaw = function(circleX, circleY, circleR, angleFromTopLeftoRight)
	{
		var circCoOrds = [0, 0];
		circCoOrds[0] = circleX + Math.sin(angleFromTopLeftoRight*(Math.PI / 180))*circleR ;
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
	getAdvancedCircularPoints = function(cX, cY, radius, angleFromTopLeftoRight, xFactor, yFactor, xxFactor, yyFactor)
	{
		var cPoints = [0,0];
		cPoints[0] = Math.round( cX + Math.sin(angleFromTopLeftoRight*xFactor*(Math.PI / 180))*radius*xxFactor );
		cPoints[1] = Math.round( cY - Math.cos(angleFromTopLeftoRight*yFactor*(Math.PI / 180))*radius*yyFactor );
		return cPoints;
	}
	getCircluarPoints3D = function(cX, cY, radius, angleFromTopLeftoRight, angleOffAxis)
	{
		var flatCircularPoints = [0,0];
		var zedCircluarPoints = [0,0];
		var threeDimensionCircularPoints = [0,0,0];
		
		//work out the standard circular points for x and y for the 2d plane
		flatCircularPoints = this.getCircularPointsRaw(cX, cY, radius, angleFromTopLeftoRight);
		zedCircluarPoints = this.getCircularPointsRaw(cX, cY, flatCircularPoints[1], 360-angleOffAxis);
		
		if(angleOffAxis<90)
		{
			threeDimensionCircularPoints[0] = flatCircularPoints[0];
			threeDimensionCircularPoints[1] = flatCircularPoints[1];
			threeDimensionCircularPoints[2] = zedCircluarPoints[0];
		}
		else if(angleOffAxis<270)
		{
			threeDimensionCircularPoints[0] = flatCircularPoints[0];
			threeDimensionCircularPoints[1] = flatCircularPoints[1];
			threeDimensionCircularPoints[2] = zedCircluarPoints[0];
		}
		else
		{
			threeDimensionCircularPoints[0] = flatCircularPoints[0];
			threeDimensionCircularPoints[1] = flatCircularPoints[1];
			threeDimensionCircularPoints[2] = zedCircluarPoints[0];
		}
		return threeDimensionCircularPoints;
	}
	get3DPoints = function (radius, angleFromTopLeftoRight, angleOffAxis)
	{
		var points3D = [0,0,0];
		points3D[0] = radius * Math.cos(angleFromTopLeftoRight*(Math.PI/180)) * Math.sin(angleOffAxis*(Math.PI/180));
		points3D[1] = radius * Math.sin(angleFromTopLeftoRight*(Math.PI/180)) * Math.sin(angleOffAxis*(Math.PI/180));
		points3D[2] = radius * Math.cos(angleOffAxis*(Math.PI/180));
		return points3D;
	}
	get3DPointsCentered = function (radius, angleFromTopLeftoRight, angleOffAxis, cX, cY, cZ)
	{
		var points3D = [0,0,0];
		points3D[0] = radius * Math.cos(angleFromTopLeftoRight*(Math.PI/180)) * Math.sin(angleOffAxis*(Math.PI/180));
		points3D[1] = radius * Math.sin(angleFromTopLeftoRight*(Math.PI/180)) * Math.sin(angleOffAxis*(Math.PI/180));
		points3D[2] = radius * Math.cos(angleOffAxis*(Math.PI/180));
		points3D[0] = cX+points3D[0];
		points3D[1] = cY+points3D[1];
		points3D[2] = cZ+points3D[2];
		return points3D;
	}
	get3DModulatedPointsCentered = function (radius, angleFromTopLeftoRight, angleOffAxis, cX, cY, cZ, freqModulator, ampModulator)
	{
		var points3D = [0,0,0];
		//s angleFromTopLeftoRight
		//t angleOffAxis
		points3D[0] = (radius * Math.sin(angleOffAxis*freqModulator*(Math.PI/180)))* ampModulator * Math.cos(angleFromTopLeftoRight*(Math.PI/180)) * Math.sin(angleOffAxis*(Math.PI/180));
		points3D[1] = (radius * Math.sin(angleOffAxis*freqModulator*(Math.PI/180)))* ampModulator * Math.sin(angleFromTopLeftoRight*(Math.PI/180)) * Math.sin(angleOffAxis*(Math.PI/180));
		points3D[2] = (radius * Math.sin(angleOffAxis*freqModulator*(Math.PI/180)))* ampModulator * Math.cos(angleOffAxis*(Math.PI/180));
		points3D[0] = cX+points3D[0];
		points3D[1] = cY+points3D[1];
		points3D[2] = cZ+points3D[2];
		return points3D;
	}
	sphericalPoints = function(radius, angleFromTopLeftoRight, angleOffAxis, cX, cY, cZ, axis, selectedRadius, pointAngle)
	{
		var points3D = [0,0,0];
		var circularPoints = [0,0];
		
		points3D = this.get3DPointsCentered(radius, angleFromTopLeftoRight, angleOffAxis, cX, cY, cZ);
		points3D = this.remapAxisPoints(axis, points3D);
		
		circularPoints = this.getCircularPointsRaw(points3D[0], points3D[1], selectedRadius, pointAngle);
		return circularPoints;
	}
	remapAxisPoints = function (axis, points3D)
	{
		var remapedPoints = [0,0,0];
		
		if(axis==0)
		{
			remapedPoints[0] = points3D[0];
			remapedPoints[1] = points3D[1];
			remapedPoints[2] = points3D[2];
		}
		else if(axis==1)
		{
			remapedPoints[0] = points3D[0];
			remapedPoints[1] = points3D[2];
			remapedPoints[2] = points3D[1];
		}
		else if(axis==2)
		{
			remapedPoints[0] = points3D[2];
			remapedPoints[1] = points3D[1];
			remapedPoints[2] = points3D[0];
		}
		return remapedPoints;
	}
	measureDistance = function(objectA3DPoints, objectB3DPoints)
	{
		var adj=0, hyp=0, opp=0, theta=0;
		//Work out the Adjecent length
		adj = objectB3DPoints[0]-objectA3DPoints[0];
		opp = objectB3DPoints[1]-objectA3DPoints[1];
		theta = Math.atan(opp/adj)*(180/Math.PI);
		if(theta==0 && adj==0)
		{
			return opp;
		}
		else if(theta==0 && opp==0)
		{
			return adj;
		}
		hyp = opp/Math.sin(theta*(Math.PI/180));
		hyp = Math.round((hyp + Number.EPSILON) * 100) / 100;
		return Math.abs(hyp);
	}
	measureAngle = function(objectA3DPoints, objectB3DPoints)
	{
		var adj=0, opp=0, theta=0;
		//Work out the Adjecent length
		adj = objectB3DPoints[0]-objectA3DPoints[0];
		opp = objectB3DPoints[1]-objectA3DPoints[1];
		theta = Math.atan(opp/adj)*(180/Math.PI);
		if(objectB3DPoints[0]>=objectA3DPoints[0] && objectB3DPoints[1]>=objectA3DPoints[1])
		{
			theta = 270+theta;
			console.log("1")
		}
		else if(objectB3DPoints[0]>=objectA3DPoints[0] && objectB3DPoints[1]<=objectA3DPoints[1])
		{
			theta = 270-Math.abs(theta);
			console.log("2")
		}
		else if(objectB3DPoints[0]<=objectA3DPoints[0] && objectB3DPoints[1]<=objectA3DPoints[1])
		{
			theta = 90+theta;
			console.log("3")
		}
		else if(objectB3DPoints[0]<=objectA3DPoints[0] && objectB3DPoints[1]>=objectA3DPoints[1])
		{
			theta = 90+theta;
			console.log("4")
		}
		theta = Math.round((theta + Number.EPSILON) * 100) / 100;
		return theta;
	}
	measureAngleRaw = function(objectA3DPoints, objectB3DPoints)
	{
		var adj=0, opp=0, theta=0;
		//Work out the Adjecent length
		adj = objectB3DPoints[1]-objectA3DPoints[1];
		opp = objectB3DPoints[0]-objectA3DPoints[0];
		theta = Math.atan(opp/adj)*(180/Math.PI);
		theta = Math.round((theta + Number.EPSILON) * 100) / 100;
		return theta;
	}
	getAngleFromCentre = function(toPoint)
	{
		return	Math.abs((Math.atan2(toPoint[0],toPoint[1])/(Math.PI/180))-180)
	}
	getAngleBetweenPoints = function(start, end)
	{
		var deltaA = end[0]-start[0], deltaB = end[1]-start[1];
		return	Math.round((Math.abs((Math.atan2(deltaA,deltaB)/(Math.PI/180))-180) + Number.EPSILON) * 100) / 100;
		
	}
	subtractiveFade = function(fadeLevel)
	{
		var xCnt=0, yCnt=0;
		
		for(yCnt=0; yCnt<this.rows; yCnt++)
		{
			for(xCnt=0; xCnt<this.cols; xCnt++)
			{
				if(this.bitmapArray[yCnt][xCnt][0]-fadeLevel<0){ this.bitmapArray[yCnt][xCnt][0]=0; }
				else{this.bitmapArray[yCnt][xCnt][0]-=fadeLevel;}
				if(this.bitmapArray[yCnt][xCnt][1]-fadeLevel<0){ this.bitmapArray[yCnt][xCnt][1]=0; }
				else{this.bitmapArray[yCnt][xCnt][1]-=fadeLevel;}
				if(this.bitmapArray[yCnt][xCnt][2]-fadeLevel<0){ this.bitmapArray[yCnt][xCnt][2]=0; }
				else{this.bitmapArray[yCnt][xCnt][2]-=fadeLevel;}
			}
		}
	}
	singleSubtractiveFade = function(currentColour, fadeBy)
	{
		var bIndex=0;
		for(bIndex=0; bIndex<currentColour.length; bIndex++)
		{
			if(currentColour[bIndex]-fadeBy<0)
			{
				currentColour[bIndex]=0;
			}
			else
			{
				currentColour[bIndex]-=fadeBy;
			}
		}
		return currentColour;
	}
	clear = function()
	{
		var xCnt=0, yCnt=0;
		for(yCnt=0; yCnt<this.rows; yCnt++)
		{
			for(xCnt=0; xCnt<this.cols; xCnt++)
			{
				this.bitmapArray[yCnt][xCnt][0] = 0;
				this.bitmapArray[yCnt][xCnt][1] = 0;
				this.bitmapArray[yCnt][xCnt][2] = 0;
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
					tempBlock.push( this.bitmapArray[limitArray[3]-1][xCnt] );
				}
			}
			//start at the end, copy next row into the current
			for(yCnt=limitArray[3]; yCnt>limitArray[2]; yCnt--)
			{
				for(xCnt=limitArray[0]; xCnt<limitArray[1]; xCnt++)
				{
					this.bitmapArray[yCnt][xCnt][0] = this.bitmapArray[yCnt-1][xCnt][0];
					this.bitmapArray[yCnt][xCnt][1] = this.bitmapArray[yCnt-1][xCnt][1];
					this.bitmapArray[yCnt][xCnt][2] = this.bitmapArray[yCnt-1][xCnt][2];
				}
			}
			//copy the last row into the 1st row if wrap is defines
			if(wrap)
			{
				for(xCnt=0; xCnt<this.cols; xCnt++)
				{
					this.bitmapArray[limitArray[2]][xCnt][0] = tempBlock[xCnt][0];
					this.bitmapArray[limitArray[2]][xCnt][1] = tempBlock[xCnt][1];
					this.bitmapArray[limitArray[2]][xCnt][2] = tempBlock[xCnt][2];
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
					tempBlock.push( this.bitmapArray[limitArray[2]][xCnt] );
				}
			}
			//start at the top, copy next row into the current
			for(yCnt=limitArray[2]; yCnt<limitArray[3]; yCnt++)
			{
				for(xCnt=limitArray[0]; xCnt<limitArray[1]; xCnt++)
				{
					this.bitmapArray[yCnt][xCnt][0] = this.bitmapArray[yCnt+1][xCnt][0];
					this.bitmapArray[yCnt][xCnt][1] = this.bitmapArray[yCnt+1][xCnt][1];
					this.bitmapArray[yCnt][xCnt][2] = this.bitmapArray[yCnt+1][xCnt][2];
				}
			}		
			//copy the 1st row into the last row
			if(wrap)
			{
				for(xCnt=0; xCnt<this.cols; xCnt++)
				{
					this.bitmapArray[limitArray[3]][xCnt][0] = tempBlock[xCnt][0];
					this.bitmapArray[limitArray[3]][xCnt][1] = tempBlock[xCnt][1];
					this.bitmapArray[limitArray[3]][xCnt][2] = tempBlock[xCnt][2];
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
					tempBlock.push( this.bitmapArray[yCnt][this.cols-1] );
				}
			}
			//start at the end, copy next row into the current
			for(xCnt=limitArray[1]-1; xCnt>limitArray[0]; xCnt--)
			{
				for(yCnt=limitArray[2]; yCnt<limitArray[3]; yCnt++)
				{
					this.bitmapArray[yCnt][xCnt][0] = this.bitmapArray[yCnt][xCnt-1][0];
					this.bitmapArray[yCnt][xCnt][1] = this.bitmapArray[yCnt][xCnt-1][1];
					this.bitmapArray[yCnt][xCnt][2] = this.bitmapArray[yCnt][xCnt-1][2];
				}
			}
			//copy the last column into the 1st column
			if(wrap)
			{
				for(yCnt=0; yCnt<this.rows; yCnt++)
				{
					this.bitmapArray[yCnt][0][0] = tempBlock[yCnt][0];
					this.bitmapArray[yCnt][0][1] = tempBlock[yCnt][1];
					this.bitmapArray[yCnt][0][2] = tempBlock[yCnt][2];
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
					tempBlock.push( this.bitmapArray[yCnt][0] );
				}
			}	
			//start at the end, copy next row into the current
			for(xCnt=limitArray[0]; xCnt<limitArray[1]-1; xCnt++)
			{
				for(yCnt=limitArray[2]; yCnt<limitArray[3]; yCnt++)
				{
					this.bitmapArray[yCnt][xCnt][0] = this.bitmapArray[yCnt][xCnt+1][0];
					this.bitmapArray[yCnt][xCnt][1] = this.bitmapArray[yCnt][xCnt+1][1];
					this.bitmapArray[yCnt][xCnt][2] = this.bitmapArray[yCnt][xCnt+1][2];
				}
			}
			//copy the 1st column into the last column
			if(wrap)
			{
				for(yCnt=0; yCnt<this.rows; yCnt++)
				{
					this.bitmapArray[yCnt][this.cols-1][0] = tempBlock[yCnt][0];
					this.bitmapArray[yCnt][this.cols-1][1] = tempBlock[yCnt][1];
					this.bitmapArray[yCnt][this.cols-1][2] = tempBlock[yCnt][2];
				}
			}
		}
	}
	
	//for spherical maps
	pixelPositionAt = function(x, y, realRadius)
	{
		var verticalMap, horizontalMap;
				
		if(y==Math.round(this.rows/2))
		{
			verticalMap = this.getCircularPoints(0, 0, realRadius, 90);
		}
		else if(y<Math.round(this.rows/2))
		{
			verticalMap = this.getCircularPoints(0, 0, realRadius, (360/Math.round(this.rows))*y);
		}
		else if(y>Math.round(this.rows/2))
		{
			verticalMap = this.getCircularPoints(0, 0, realRadius, (360/Math.round(this.rows))*y);
			verticalMap[1] = verticalMap[1]*-1;
		}
		horizontalMap = this.getCircularPoints(0, 0, verticalMap[0], (360/Math.round(this.cols))*x );
		
		return [horizontalMap[0],verticalMap[1],horizontalMap[1]];
	}
	pixelAt = function(x, y)
	{
		return this.bitmapArray[y][x];
	}
	hasColour = function(x, y)
	{
		if( (this.bitmapArray[y][x][0]+this.bitmapArray[y][x][1]+this.bitmapArray[y][x][2])>0 )
		{
			return 1;
		}
		else
		{
			return 0;
		}
	}
	getHeight = function(x, y, range)
	{
		var currentPixel = this.pixelAt(x, y);
		var returnValue = currentPixel[0]+currentPixel[1]+currentPixel[2];
		return (returnValue/(256*3))*range;
	}
	getWave = function(counter, minWave, maxWave)
	{
		return ( Math.sin(counter)*((maxWave-minWave)/2) )+( maxWave-((maxWave-minWave)/2) );
	}
	moveObjectAtoB = function (objectAPoints, objectBPoints, amountToMove)
	{
		var angleFromAtoB = this.measureAngle(objectAPoints, objectBPoints);
		var distance = this.measureDistance(objectAPoints, objectAPoints);
		var shiftTo = this.getCircularPoints(objectAPoints[0], objectAPoints[1], amountToMove, angleFromAtoB);
		return shiftTo;
	}
	randomDirectionalVectors = function()
	{
		var rotationVectors = [0,0,0];
		if( Math.round(Math.random()) == 1 ){rotationVectors[0]=1;}else{rotationVectors[0]=-1;}
		if( Math.round(Math.random()) == 1 ){rotationVectors[1]=1;}else{rotationVectors[1]=-1;}
		if( Math.round(Math.random()) == 1 ){rotationVectors[2]=1;}else{rotationVectors[2]=-1;}
		return rotationVectors;
	}
	
}
export default pixelMaper;
