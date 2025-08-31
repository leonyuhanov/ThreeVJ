import * as THREE from 'three';
import envelopGenerator from './envelopGenerator.js';					//Envelop Generator
import CCGenerator from './CCGenerator.js';								//Colour System
import timerObject from './timerObject.js';								//Timers
import pixelMaper from './pixelMaper.js';								//Pixel Maper
import animationObject from './animationObject.js';						//Generic Object Tracking class
import ElipticalEnvelopGenerator from './ElipticalEnvelopGenerator.js';

class threePollyTrails
{	
	constructor()
	{
		//Main object stores
		this.objectTape = new Array();
		this.globalGroupArray = new Array();
		this.globalObjectGroup = new THREE.Object3D();
		this.groupName = "PT_";
		this.objectIDIndex = 0;
		this.genObject = new animationObject();
		
		//Global Three Objects form main System
		this.scene;
		
		//Main properties
		this.origin = [0,0,0];
		this.radius = 50;
		this.numberOfPollys = 1;
		this.pollySpacer = 50;
		this.angularRotationsPerPolly = [0,0,0];
		this.pointsPerPolly = 4;
		this.pollyOpacity = 1;
		this.numberOfTrails = 1;
		this.trailDensity = 20;
		this.trailLengthInDegrees = 10;
		this.trailOrbitRadiusRange = 2;
		this.trailMotionDirection = 1;
		this.setUpStatus = 0;
		this.multiObject = 0;
		this.enablePollyBloom = 0;
		this.enableTrailBloom = 1
		this.startAngle = 45;
		
		//Utility Objects
		this.pixelMap = new pixelMaper(2,2);
		this.screenRange = [300,200,300];
		this.timers = new timerObject();
		this.envelops = new envelopGenerator();
		this.lfo = new ElipticalEnvelopGenerator();
		this.directionalVectors = [1,1,1];
		
		//Colour System
		this.colourIndex = 0;
		this.subColourIndex = 0;
		this.maxValue = 255;
		this.maxColourDitherSteps = 128;
		this.colourList_1 = [this.maxValue,0,0,this.maxValue,this.maxValue,0, 0,this.maxValue,0, 0,this.maxValue,this.maxValue, 0,0,this.maxValue, this.maxValue,0,this.maxValue, this.maxValue,this.maxValue,this.maxValue];
		this.colourObject = new CCGenerator(this.maxColourDitherSteps, this.colourList_1.length/3, this.colourList_1);
	}
	
	init = function(scene, colourIndex)
	{
		this.scene = scene;
		this.colourIndex = colourIndex;
	}
	animate = function(colourIncrement, subColourIncrement, radiusScaler, controlArray, rotationalIncrements=[0,0,0], innerRotationalIncrements=[0,0,0])
	{
		//creation loop
		this.orbitCreationLoop();
		if(this.setUpStatus==0){return;}
		var localObjectCounter=0, localTrailCounter, localTrailPointCounter, pointCounter;
		var vectorPoints, verticies, tempLocationInDegrees, pointPos, tempPointRadius=[0,0,0];
		var tempRadius, tempTrailDensity, tempTrailLength, trailLiniarEnvelop, trailThicknessScale;
		var localAngularLFOIndex = this.lfo.getTimeCode("rotationalAngle"), localAngularLFO;
		
		for(localObjectCounter=0; localObjectCounter<this.objectTape.length; localObjectCounter++)
		{
			tempRadius = this.objectTape[localObjectCounter].radius*radiusScaler;
			//recreate shape path based on changed radius
			verticies = new Array();
			this.objectTape[localObjectCounter].shape[0] = new THREE.Shape();
			for(pointCounter=0; pointCounter<this.objectTape[localObjectCounter].pollyPoints; pointCounter++)
			{
				vectorPoints = this.pixelMap.getElipticalPointsRaw(0, 0, tempRadius, tempRadius, ((360/this.objectTape[localObjectCounter].pollyPoints)*pointCounter)+this.startAngle);
				verticies.push( new THREE.Vector3(vectorPoints[0], vectorPoints[1],  0) );
				if(pointCounter==0)
				{
					this.objectTape[localObjectCounter].shape[0].moveTo(vectorPoints[0], vectorPoints[1]);
				}
				else
				{
					this.objectTape[localObjectCounter].shape[0].lineTo(vectorPoints[0], vectorPoints[1]);
				}
				
			}
			//insert 1st point again
			vectorPoints = this.pixelMap.getElipticalPointsRaw(0, 0, tempRadius, tempRadius, this.startAngle);
			verticies.push( new THREE.Vector3(vectorPoints[0], vectorPoints[1], 0) );
			this.objectTape[localObjectCounter].shape[0].lineTo(vectorPoints[0], vectorPoints[1]);
			this.objectTape[localObjectCounter].geometry[0].dispose();
			this.objectTape[localObjectCounter].geometry[0].setFromPoints( verticies );
			//animate trails
			for(localTrailCounter=0; localTrailCounter<this.objectTape[localObjectCounter].subPollyPoints; localTrailCounter++)
			{
				//increment trails angular position on object
				this.objectTape[localObjectCounter].motionIncrements[0] = (this.objectTape[localObjectCounter].motionIncrements[0]+this.angleToFloatAngle(controlArray[0]))%1;
				//re-create a point cloud trail
				verticies = new Array();
				tempTrailDensity = this.objectTape[localObjectCounter].extrudeDepth*controlArray[1];
				tempTrailLength = this.trailLengthInDegrees*controlArray[2];
				for(localTrailPointCounter=0; localTrailPointCounter<tempTrailDensity; localTrailPointCounter++)
				{
					//Location of this point in degrees of main oject
					tempLocationInDegrees = Math.random()*tempTrailLength;
					trailLiniarEnvelop = 1-(tempLocationInDegrees/tempTrailLength);
					tempLocationInDegrees = this.angleToFloatAngle( tempLocationInDegrees );
					this.generatedirectionalVectors();
					trailThicknessScale = this.trailOrbitRadiusRange*controlArray[3];
					tempPointRadius = [ (trailThicknessScale*Math.random())*this.directionalVectors[0], (trailThicknessScale*Math.random())*this.directionalVectors[1], (trailThicknessScale*Math.random())*this.directionalVectors[2]];
					tempPointRadius[0] = tempPointRadius[0]*trailLiniarEnvelop;
					tempPointRadius[1] = tempPointRadius[1]*trailLiniarEnvelop;
					tempPointRadius[2] = tempPointRadius[2]*trailLiniarEnvelop;
					vectorPoints = this.objectTape[localObjectCounter].shape[0].getPoint((tempLocationInDegrees+this.objectTape[localObjectCounter].motionIncrements[0])%1);
					verticies.push(vectorPoints.x+tempPointRadius[0], vectorPoints.y+tempPointRadius[1], tempPointRadius[2]);
				}
				this.objectTape[localObjectCounter].geometry[localTrailCounter+1].dispose();
				this.objectTape[localObjectCounter].geometry[localTrailCounter+1].setAttribute( 'position', new THREE.Float32BufferAttribute( verticies , 3 ) );
				//colour
				this.colourObject.getColour(this.subColourIndex%this.colourObject._bandWidth);
				this.objectTape[localObjectCounter].materials[localTrailCounter+1].color.r = this.colourObject._currentColour[0]/255;
				this.objectTape[localObjectCounter].materials[localTrailCounter+1].color.g = this.colourObject._currentColour[1]/255;
				this.objectTape[localObjectCounter].materials[localTrailCounter+1].color.b = this.colourObject._currentColour[2]/255;
				this.subColourIndex += subColourIncrement;
			}
			//sub group rotation
			
			//this.globalGroupArray[localObjectCounter].rotateX( this.angleToRadian(innerRotationalIncrements[0]) );
			
			this.globalGroupArray[localObjectCounter].rotateY( this.angleToRadian(innerRotationalIncrements[0])*this.objectTape[localObjectCounter].rotations[0] );
			this.globalGroupArray[localObjectCounter].rotateY( this.angleToRadian(innerRotationalIncrements[1])*this.objectTape[localObjectCounter].rotations[1] );
			this.globalGroupArray[localObjectCounter].rotateZ( this.angleToRadian(innerRotationalIncrements[2])*this.objectTape[localObjectCounter].rotations[2] );
			
			localAngularLFO = this.angleToRadian( 45*(this.lfo.read("rotationalAngle", 0.0005, 0)/100) );
			this.globalGroupArray[localObjectCounter].rotateY( localAngularLFO );
		}
		
		this.colourIndex += colourIncrement;
		this.subColourIndex = this.colourIndex;
		
		
		
		this.globalObjectGroup.rotateX( (rotationalIncrements[0])*(Math.PI/180) );
		this.globalObjectGroup.rotateY( (rotationalIncrements[1])*(Math.PI/180) );
		this.globalObjectGroup.rotateZ( (rotationalIncrements[2])*(Math.PI/180) );	
		this.lfo.setTimeCode("rotationalAngle", localAngularLFOIndex+0.0001);		
	}
	updatePath = function()
	{
		if(this.setUpStatus==0){return;}
	}
	insertObject = function()
	{
		var pollyCounter=0, pointCounter=0, trailCounter=0, trailPointCounter=0, tempPointRadius=[0,0,0];
		var vectorPoints, verticies, tempLocationInDegrees, pointPos;
		var localGroup;
		
		for(pollyCounter=0; pollyCounter<this.numberOfPollys; pollyCounter++)
		{
			localGroup = new THREE.Object3D();
			this.objectTape.push( new animationObject() );
			this.objectTape[pollyCounter].objectID = this.groupName+this.objectIDIndex;
			this.objectTape[pollyCounter].position = [0,0,0];
			this.objectTape[pollyCounter].radius = this.radius+(this.pollySpacer*pollyCounter);
			this.objectTape[pollyCounter].pollyPoints = this.pointsPerPolly;
			this.objectTape[pollyCounter].subPollyPoints = this.numberOfTrails
			this.objectTape[pollyCounter].extrudeDepth = this.trailDensity;
			this.objectTape[pollyCounter].colourIndex = this.colourIndex+(pollyCounter*(this.maxColourDitherSteps/2));
			this.generatedirectionalVectors();
			this.objectTape[pollyCounter].rotations = [this.directionalVectors[0], this.directionalVectors[1], this.directionalVectors[2]];
			this.objectTape[pollyCounter].motionIncrements[0] = this.angleToFloatAngle( Math.random()*360 );
			//this.objectTape[pollyCounter].pixelMapIndex = [this.angleToRadian((360/this.numberOfPollys)*pollyCounter), this.angleToRadian((360/this.numberOfPollys)*pollyCounter), this.angleToRadian((360/this.numberOfPollys)*pollyCounter)];
			//this.objectTape[pollyCounter].pixelMapIndex = [this.angleToRadian(pollyCounter*2), this.angleToRadian(pollyCounter*2), this.angleToRadian(pollyCounter*2)];
			this.objectTape[pollyCounter].pixelMapIndex = [0,0,0];
			//create layers shape object to opain points
			this.objectTape[pollyCounter].shape.push( new THREE.Shape() );
			verticies = new Array();
			for(pointCounter=0; pointCounter<this.objectTape[pollyCounter].pollyPoints; pointCounter++)
			{
				vectorPoints = this.pixelMap.getElipticalPointsRaw(0, 0, this.objectTape[pollyCounter].radius, this.objectTape[pollyCounter].radius, ((360/this.objectTape[pollyCounter].pollyPoints)*pointCounter)+this.startAngle);
				verticies.push( new THREE.Vector3(vectorPoints[0], vectorPoints[1],  0) );
				if(pointCounter==0)
				{
					this.objectTape[pollyCounter].shape[0].moveTo(vectorPoints[0], vectorPoints[1]);
				}
				else
				{
					this.objectTape[pollyCounter].shape[0].lineTo(vectorPoints[0], vectorPoints[1]);
				}
				
			}
			//insert 1st point again
			vectorPoints = this.pixelMap.getElipticalPointsRaw(0, 0, this.objectTape[pollyCounter].radius, this.objectTape[pollyCounter].radius, this.startAngle);
			verticies.push( new THREE.Vector3(vectorPoints[0], vectorPoints[1], 0) );
			this.objectTape[pollyCounter].shape[0].lineTo(vectorPoints[0], vectorPoints[1]);
			this.objectTape[pollyCounter].geometry.push(new THREE.BufferGeometry());
			this.objectTape[pollyCounter].materials.push( new THREE.LineBasicMaterial({color: 0xffffff}) );
			this.objectTape[pollyCounter].materials[0].transparent = true;
			this.objectTape[pollyCounter].materials[0].opacity = this.pollyOpacity;
			this.objectTape[pollyCounter].geometry[0].setFromPoints( verticies );
			this.objectTape[pollyCounter].objects.push( new THREE.Line(this.objectTape[pollyCounter].geometry[0], this.objectTape[pollyCounter].materials[0]) );
			if(this.enablePollyBloom==1)
			{
				this.objectTape[pollyCounter].objects[0].layers.enable( 1 );
			}
			localGroup.add( this.objectTape[pollyCounter].objects[0] );
			//insert trails
			for(trailCounter=0; trailCounter<this.objectTape[pollyCounter].subPollyPoints; trailCounter++)
			{
				//create a point cloud trail
				verticies = new Array();
				for(trailPointCounter=0; trailPointCounter<this.objectTape[pollyCounter].extrudeDepth; trailPointCounter++)
				{
					//Location of this point in degrees of main oject
					tempLocationInDegrees = this.angleToFloatAngle( Math.random()*this.trailLengthInDegrees );
					this.generatedirectionalVectors();
					tempPointRadius = [ (this.trailOrbitRadiusRange*Math.random())*this.directionalVectors[0], (this.trailOrbitRadiusRange*Math.random())*this.directionalVectors[1], (this.trailOrbitRadiusRange*Math.random())*this.directionalVectors[2]];
					vectorPoints = this.objectTape[pollyCounter].shape[0].getPoint((tempLocationInDegrees+this.objectTape[pollyCounter].motionIncrements[0])%1);
					verticies.push(vectorPoints.x+tempPointRadius[0], vectorPoints.y+tempPointRadius[1], tempPointRadius[2]);
				}
				this.objectTape[pollyCounter].geometry.push(new THREE.BufferGeometry());
				this.objectTape[pollyCounter].materials.push( new THREE.PointsMaterial({color: 0xffffff, size: 1 }) );
				this.objectTape[pollyCounter].materials[trailCounter+1].transparent = true;
				this.objectTape[pollyCounter].materials[trailCounter+1].opacity = 1;
				this.objectTape[pollyCounter].geometry[trailCounter+1].setAttribute( 'position', new THREE.Float32BufferAttribute( verticies , 3 ) );
				this.objectTape[pollyCounter].objects.push( new THREE.Points(this.objectTape[pollyCounter].geometry[trailCounter+1], this.objectTape[pollyCounter].materials[trailCounter+1]) );
				if(this.enableTrailBloom==1)
				{
					this.objectTape[pollyCounter].objects[trailCounter+1].layers.enable( 1 );
				}
				localGroup.add( this.objectTape[pollyCounter].objects[trailCounter+1] );
			}
			this.globalGroupArray.push( localGroup );
			//rotate based on -> this.angularRotationsPerPolly
			this.globalGroupArray[pollyCounter].rotateX( this.angleToRadian(this.angularRotationsPerPolly[0]*pollyCounter) );
			this.globalObjectGroup.add( localGroup );
			this.objectIDIndex++;
		}
		//complete set up
		this.globalObjectGroup.position.x =  this.origin[0];
		this.globalObjectGroup.position.y =  this.origin[1];
		this.globalObjectGroup.position.z =  this.origin[2];

		if(this.multiObject==0)
		{
			this.scene.add( this.globalObjectGroup );
		}
		this.setUpStatus = 1;
		this.lfo.addWithTimeCode("rotationalAngle", [100], [100], 0, 0);
	}
	generatedirectionalVectors = function()
	{
		if( Math.round(Math.random()) == 1 ){this.directionalVectors[0]=1;}else{this.directionalVectors[0]=-1;}
		if( Math.round(Math.random()) == 1 ){this.directionalVectors[1]=1;}else{this.directionalVectors[1]=-1;}
		if( Math.round(Math.random()) == 1 ){this.directionalVectors[2]=1;}else{this.directionalVectors[2]=-1;}
	}
	seed = function(originPoint)
	{
		if(originPoint==undefined)
		{
			this.origin[0] = (-this.screenRange[0])+Math.round(Math.random()*(this.screenRange[0]*2));
			this.origin[1] = (this.screenRange[1])-Math.round(Math.random()*(this.screenRange[1]*2));
			this.origin[2] = (-this.screenRange[2])+Math.round(Math.random()*(this.screenRange[2]*2));
		}
		else
		{
			this.origin[0] = originPoint[0];
			this.origin[1] = originPoint[1];
			this.origin[2] = originPoint[2];
		}
		this.create = 0;
	}
	orbitCreationLoop = function()
	{
		if(this.setUpStatus==0)
		{
			this.insertObject();
		}
	}
	angleToRadian = function(angle)
	{
		return (angle%360)*(Math.PI/180);
	}
	angleToFloatAngle = function(angle)
	{
		return (angle%360)/360;
	}
	floatAngleToAngle = function (floatAngle)
	{
		return floatAngle*360;
	}
}
export default threePollyTrails;