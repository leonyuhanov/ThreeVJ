import * as THREE from 'three';
import envelopGenerator from './envelopGenerator.js';					//Envelop Generator
import CCGenerator from './CCGenerator.js';								//Colour System
import timerObject from './timerObject.js';								//Timers
import pixelMaper from './pixelMaper.js';								//Pixel Maper
import animationObject from './animationObject.js';						//Generic Object Tracking class
import ElipticalEnvelopGenerator from './ElipticalEnvelopGenerator.js';

class threePointsControled
{	
	constructor()
	{
		//Main object stores
		this.objectTape = new Array();
		this.globalGroupArray = new Array();
		this.globalObjectGroup = new THREE.Object3D();
		this.groupName = "PC_";
		this.objectIDIndex = 0;
		this.genObject = new animationObject();
		
		//Global Three Objects form main System
		this.scene;
		
		//Main properties
		this.origin = [0,0,0];
		this.pointCount = 100;
		this.lfoPoints = [100,100];
		this.particlePoints = new Array();
		this.bloomEnable = 1;
		this.multiObject = 0;
		this.setUpStatus = 0;
		
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
		this.lfo.addWithTimeCode("mainLFO", [this.lfoPoints[0]], [this.lfoPoints[1]], 0, 0);
	}
	animate = function(colourIncrement, subColourIncrement, controlData, rotationalIncrements=[0,0,0])
	{
		if(this.setUpStatus==0){return;}
		var particleCounter, verticies, tempHeight, objectIndex=0, localGroup;
		var yRange = this.screenRange[1]*2, yStart = -this.screenRange[1];
		var xRange = this.screenRange[0]*2, xStart = -this.screenRange[0];
		var currentTimeStamp = this.lfo.getTimeCode("mainLFO");
		
		//Regenerate points with controlData[0] as the LFO increment
		verticies = new Array();
		for(particleCounter=0; particleCounter<this.pointCount; particleCounter++)
		{
			this.objectTape[objectIndex].motionIncrements[0] = controlData[0];
			tempHeight = yStart+((this.lfo.read("mainLFO", this.objectTape[objectIndex].motionIncrements[0], 0)/this.lfoPoints[0])*yRange);
			this.particlePoints[particleCounter][0] = xStart+(xRange/this.pointCount)*particleCounter;
			this.particlePoints[particleCounter][1] = tempHeight;
			this.particlePoints[particleCounter][2] = 0;
			verticies.push( this.particlePoints[particleCounter][0], this.particlePoints[particleCounter][1], this.particlePoints[particleCounter][2] );
		}
		this.objectTape[objectIndex].geometry[0].setAttribute( 'position', new THREE.Float32BufferAttribute( verticies , 3 ) );
		//colour
		this.colourObject.getColour(this.subColourIndex%this.colourObject._bandWidth);
		this.objectTape[objectIndex].materials[0].color.r = this.colourObject._currentColour[0]/255;
		this.objectTape[objectIndex].materials[0].color.g = this.colourObject._currentColour[1]/255;
		this.objectTape[objectIndex].materials[0].color.b = this.colourObject._currentColour[2]/255;
		//increment lfo and reset tracker
		this.lfo.setTimeCode("mainLFO", currentTimeStamp+controlData[1]);
		this.objectTape[objectIndex].motionIncrements[0] = 0;
		
		this.colourIndex += colourIncrement;
		this.subColourIndex = this.colourIndex;		
		
		this.globalObjectGroup.rotateX( (rotationalIncrements[0])*(Math.PI/180) );
		this.globalObjectGroup.rotateY( (rotationalIncrements[1])*(Math.PI/180) );
		this.globalObjectGroup.rotateZ( (rotationalIncrements[2])*(Math.PI/180) );	
	}
	updatePath = function()
	{
		if(this.setUpStatus==0){return;}
	}
	insertObject = function()
	{
		var particleCounter, verticies, tempHeight, objectIndex=0, localGroup;
		var yRange = this.screenRange[1]*2, yStart = -this.screenRange[1];
		var xRange = this.screenRange[0]*2, xStart = -this.screenRange[0];
		
		localGroup = new THREE.Object3D();
		this.objectTape.push( new animationObject() );
		this.objectTape[objectIndex].objectID = this.groupName+this.objectIDIndex;
		this.objectTape[objectIndex].position = [this.origin[0],this.origin[1],this.origin[2]];

		verticies = new Array();
		for(particleCounter=0; particleCounter<this.pointCount; particleCounter++)
		{
			tempHeight = yStart+((this.lfo.read("mainLFO", 1, 0)/this.lfoPoints[0])*yRange);
			this.particlePoints.push( [xStart+(xRange/this.pointCount)*particleCounter, tempHeight, 0] );
			verticies.push( xStart+((xRange/this.pointCount)*particleCounter), tempHeight, 0 );
		}
		this.objectTape[objectIndex].geometry.push(new THREE.BufferGeometry());
		this.objectTape[objectIndex].materials.push( new THREE.PointsMaterial({color: 0xffffff, size: 1 }) );
		this.objectTape[objectIndex].materials[0].transparent = true;
		this.objectTape[objectIndex].materials[0].opacity = 1;
		this.objectTape[objectIndex].geometry[0].setAttribute( 'position', new THREE.Float32BufferAttribute( verticies , 3 ) );
		this.objectTape[objectIndex].objects.push( new THREE.Points(this.objectTape[objectIndex].geometry[0], this.objectTape[objectIndex].materials[0]) );
		if(this.bloomEnable==1)
		{
			this.objectTape[objectIndex].objects[0].layers.enable( 1 );
		}
		localGroup.add( this.objectTape[objectIndex].objects[0] );
		
		//finalize objects
		this.globalGroupArray.push( localGroup );
		this.globalObjectGroup.add( localGroup );
		this.globalObjectGroup.position.x =  this.origin[0];
		this.globalObjectGroup.position.y =  this.origin[1];
		this.globalObjectGroup.position.z =  this.origin[2];
		if(this.multiObject==0)
		{
			this.scene.add( this.globalObjectGroup );
		}
		this.setUpStatus = 1;
		this.objectIDIndex++;
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
		this.insertObject();
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
export default threePointsControled;