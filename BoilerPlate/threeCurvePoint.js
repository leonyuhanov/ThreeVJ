class curvePoint
{
	constructor(radius, angle, minAngle, maxAngle)
	{
		this.radius = radius;
		this.initRadius = radius;
		this.angle = angle;
		this.initAngle = angle;
		this.minAngle = minAngle;
		this.maxAngle = maxAngle;
		this.angleRange = maxAngle-minAngle;
		this.position = [0,0,0];
		this.vector = 1;
		this.wobble = 0;
		this.init();
	}
	init = function()
	{
		var xyPos;
		xyPos = this.getElipticalPointsRaw(0, 0, this.radius, this.radius, this.angle);
		this.position[0] = xyPos[0];
		this.position[1] = xyPos[1];
	}
	setAngle = function(angle)
	{
		var xyPos;
		this.angle = angle;
		xyPos = this.getElipticalPointsRaw(0, 0, this.radius, this.radius, this.angle);
		this.position[0] = xyPos[0];
		this.position[1] = xyPos[1];
	}
	setRadius = function(radius)
	{
		var xyPos;
		this.radius = radius;
		xyPos = this.getElipticalPointsRaw(0, 0, this.radius, this.radius, this.angle);
		this.position[0] = xyPos[0];
		this.position[1] = xyPos[1];
	}
	getElipticalPointsRaw = function(circleX, circleY, width, height, angleFromTopLeftoRight)
	{
		var circCoOrds = [0, 0];
		circCoOrds[0] = circleX + Math.sin(angleFromTopLeftoRight*(Math.PI / 180))*width ;
		circCoOrds[1] = circleY - Math.cos(angleFromTopLeftoRight*(Math.PI / 180))*height;
		return circCoOrds;
	}
}
export default curvePoint;