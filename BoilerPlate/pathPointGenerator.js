class pathPointGenerator
{	
	constructor()
	{
	
	}
	pointOnPath = function(pathX, pathY, radius, pathRangle, angleOnPath)
	{
		var returnData = [0,0,0], xyPart = [0,0];
		
		//normalise angles
		pathRangle = pathRangle%360;
		angleOnPath = angleOnPath%360;
		
		//calculate the XY portion using a flat elipse angled using the pathAngle of the xy point on the pathAngle
		xyPart = this.getElipticalPointsRaw(pathX, pathY, 0, radius, pathRangle;
	}
	getElipticalPointsRaw = function(circleX, circleY, width, height, angleFromTopLeftoRight)
	{
		var circCoOrds = [0, 0];
		circCoOrds[0] = circleX + Math.sin(angleFromTopLeftoRight*(Math.PI / 180))*width ;
		circCoOrds[1] = circleY - Math.cos(angleFromTopLeftoRight*(Math.PI / 180))*height;
		return circCoOrds;
	}
	getElipticalPointsXRaw = function(circleX, width, angleFromTopLeftoRight)
	{
		var xPoint;
		xPoint = circleX + Math.sin(angleFromTopLeftoRight*(Math.PI / 180))*width ;
		return xPoint;
	}
	getAngleFromCentre = function(toPoint)
	{
		return	Math.abs((Math.atan2(toPoint[0],toPoint[1])/(Math.PI/180))-180)
	}

}
export  default pathPointGenerator;