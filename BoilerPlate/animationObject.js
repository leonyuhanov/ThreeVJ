class animationObject
{	
	constructor()
	{
		this.objectID = 0;
		this.position = [0,0,0];
		this.dimensions = [0,0,0];
		this.scale = [1,1,1];
		this.setUpStatus = 0;
		this.geometry = new Array();
		this.materials = new Array();
		this.objects = new Array();
		this.shape = new Array();
		this.extrude = new Array();
		this.pointData = new Array();
		this.axis = 0;
		this.axisOffset = 0;
		this.radius = 0;
		this.subRadius = 0;
		this.pollyPoints = 0;
		this.subPollyPoints = 0;
		this.extrudeDepth = 0;
		this.pointAngleOffset = 0;
		this.subPointAngleOffset = 0;
		this.rotations = [0,0,0];
		this.colourIndex = 0;
		this.motionIncrements = [0,0,0];
		this.opacity = 1;
		this.pixelMapIndex = [0,0];
		this.texture;
		this.canvasObject;
	}
}
export default animationObject;