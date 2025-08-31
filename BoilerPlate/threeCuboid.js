import * as THREE from 'three';
import envelopGenerator from './envelopGenerator.js';					//Envelop Generator
import CCGenerator from './CCGenerator.js';								//Colour System
import timerObject from './timerObject.js';								//Timers
import pixelMaper from './pixelMaper.js';								//Pixel Maper
import animationObject from './animationObject.js';						//Generic Object Tracking class
import ElipticalEnvelopGenerator from './ElipticalEnvelopGenerator.js';

class threeCuboid
{	
	constructor()
	{
		//Main object stores
		this.objectTape = new Array();
		this.globalGroupArray = new Array();
		this.globalObjectGroup = new THREE.Object3D();
		this.groupName = "CB_";
		this.objectIDIndex = 0;
		this.genObject = new animationObject();
		
		//Global Three Objects form main System
		this.scene;
		
		//Main properties
		this.origin = [0,0,0];
		this.faceDimensions = [10,10,2];
		this.faceSpacer = 5;
		this.animationOrder = [0,3,1,4,2,5];
		this.faceRotations = ["y", "y", "y", "y", "y", "y"];
		this.resetRotations = ["y", "y", "z", "z", "x", "x"]
		this.bloomEnable = 0;
		this.sphereEnable = 0;
		this.multiObject = 0;
		this.setUpStatus = 0;
		this.animateIndex = -1;
		
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
	animate = function(colourIncrement, subColourIncrement, controlData, rotationalIncrements=[0,0,0])
	{
		if(this.setUpStatus==0){return;}
		if(this.animateIndex==-1){return;}
		
		var tempSpacer = this.faceSpacer*controlData[2];
		var objectIndex = this.animationOrder[this.animateIndex], cuboidDimentions = (this.faceDimensions[0]+(2*this.faceDimensions[2])+(2*tempSpacer))*controlData[1];
		if(this.objectTape[objectIndex].rotations[0]+(this.objectTape[objectIndex].motionIncrements[0]*controlData[0])<=180)
		{
			this.objectTape[objectIndex].rotations[0] += this.objectTape[objectIndex].motionIncrements[0]*controlData[0];
			if(this.faceRotations[objectIndex]=="x")
			{
				this.objectTape[objectIndex].objects[0].rotateX( this.angleToRadian(this.objectTape[objectIndex].motionIncrements[0]*controlData[0]) );
			}
			else if(this.faceRotations[objectIndex]=="y")
			{
				this.objectTape[objectIndex].objects[0].rotateY( this.angleToRadian(this.objectTape[objectIndex].motionIncrements[0]*controlData[0]) );
			}
			else if(this.faceRotations[objectIndex]=="z")
			{
				this.objectTape[objectIndex].objects[0].rotateZ( this.angleToRadian(this.objectTape[objectIndex].motionIncrements[0]*controlData[0]) );
			}
			//transparency
			this.objectTape[objectIndex].materials[0].opacity = (this.objectTape[objectIndex].rotations[0]/180);
				
		}
		else
		{
			//reset face rotation
			if(this.resetRotations[objectIndex]=="x")
			{
				this.objectTape[objectIndex].objects[0].setRotationFromEuler( new THREE.Euler( this.angleToRadian(90), 0, 0, 'XYZ' ));
			}
			else if(this.resetRotations[objectIndex]=="y")
			{
				this.objectTape[objectIndex].objects[0].setRotationFromEuler( new THREE.Euler( 0, 0, 0, 'XYZ' ));
			}
			else if(this.resetRotations[objectIndex]=="z")
			{
				this.objectTape[objectIndex].objects[0].setRotationFromEuler( new THREE.Euler( 0, this.angleToRadian(90), 0, 'XYZ' ));
			}
			//transparency reset
			this.objectTape[objectIndex].materials[0].opacity = 1;
			
			this.objectTape[objectIndex].rotations[0]=0;
			if(this.animateIndex+1<this.animationOrder.length)
			{
				this.animateIndex++;
			}
			else
			{
				this.animateIndex = -1;
			}
		}
		
		//sphere colour
		if(this.sphereEnable==1)
		{
			this.colourObject.getColour(this.colourIndex%this.colourObject._bandWidth);
			this.objectTape[6].materials[0].color.r = this.colourObject._currentColour[0]/255;
			this.objectTape[6].materials[0].color.g = this.colourObject._currentColour[1]/255;
			this.objectTape[6].materials[0].color.b = this.colourObject._currentColour[2]/255;
		}
		
		//scale
		for(objectIndex=0; objectIndex<this.objectTape.length; objectIndex++)
		{
			this.objectTape[objectIndex].objects[0].scale.set(controlData[1], controlData[1], controlData[1]);
		}
		//FRONT
		this.objectTape[0].objects[0].position.z = cuboidDimentions/2;
		//REAR
		this.objectTape[1].objects[0].position.z = -cuboidDimentions/2;
		//RIGHT
		this.objectTape[2].objects[0].position.x = cuboidDimentions/2;
		//LEFT
		this.objectTape[3].objects[0].position.x = -cuboidDimentions/2;
		//TOP
		this.objectTape[4].objects[0].position.y = cuboidDimentions/2;
		//bottom
		this.objectTape[5].objects[0].position.y = -cuboidDimentions/2;
		
		
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
		var objectIndex=0, totalObjects=6;
		var cuboidDimentions = this.faceDimensions[0]+(2*this.faceDimensions[2])+(2*this.faceSpacer);
		var localGroup = new THREE.Object3D();
		
		for(objectIndex=0; objectIndex<totalObjects; objectIndex++)
		{
			//create each face
			this.objectTape.push( new animationObject() );
			this.objectTape[objectIndex].objectID = this.groupName+this.objectIDIndex;
			this.objectTape[objectIndex].motionIncrements[0] = 2;//Math.round((Math.random()*10))+5;
			this.objectTape[objectIndex].geometry.push(new THREE.BoxGeometry(this.faceDimensions[0],this.faceDimensions[1],this.faceDimensions[2]));
			this.objectTape[objectIndex].materials.push( new THREE.MeshLambertMaterial({color: 0xffffff }) );
			this.objectTape[objectIndex].materials[0].transparent = true;
			this.objectTape[objectIndex].materials[0].opacity = 1;
			//FACE colour
			this.colourObject.getColour((this.colourIndex+(50*objectIndex))%this.colourObject._bandWidth);
			this.objectTape[objectIndex].materials[0].color.r = this.colourObject._currentColour[0]/255;
			this.objectTape[objectIndex].materials[0].color.g = this.colourObject._currentColour[1]/255;
			this.objectTape[objectIndex].materials[0].color.b = this.colourObject._currentColour[2]/255;
			this.objectTape[objectIndex].objects.push( new THREE.Mesh(this.objectTape[objectIndex].geometry[0], this.objectTape[objectIndex].materials[0]) );
			if(this.bloomEnable==1)
			{
				this.objectTape[objectIndex].objects[0].layers.enable( 1 );
			}
			this.objectIDIndex++;
			//add to local group
			localGroup.add( this.objectTape[objectIndex].objects[0] );
		}
		//insert Glowing centre
		if(this.sphereEnable==1)
		{
			this.objectTape.push( new animationObject() );
			this.objectTape[objectIndex].objectID = this.groupName+this.objectIDIndex;
			this.objectTape[objectIndex].radius = cuboidDimentions/3;
			this.objectTape[objectIndex].geometry.push(new THREE.SphereGeometry(this.objectTape[objectIndex].radius,20,20));
			this.objectTape[objectIndex].materials.push( new THREE.MeshLambertMaterial({color: 0xffffff }) );
			this.objectTape[objectIndex].materials[0].transparent = true;
			this.objectTape[objectIndex].materials[0].opacity = 1;
			this.objectTape[objectIndex].objects.push( new THREE.Mesh(this.objectTape[objectIndex].geometry[0], this.objectTape[objectIndex].materials[0]) );
			this.objectTape[objectIndex].objects[0].layers.enable( 1 );
			localGroup.add( this.objectTape[objectIndex].objects[0] );
		}
		
		this.objectIDIndex++;
		
		//position and rotate each face
		//FRONT
		this.objectTape[0].objects[0].position.z = cuboidDimentions/2;
		//REAR
		this.objectTape[1].objects[0].position.z = -cuboidDimentions/2;
		//RIGHT
		this.objectTape[2].objects[0].position.x = cuboidDimentions/2;
		this.objectTape[2].objects[0].rotateY( this.angleToRadian(90) );
		//LEFT
		this.objectTape[3].objects[0].position.x = -cuboidDimentions/2;
		this.objectTape[3].objects[0].rotateY( this.angleToRadian(90) );
		//TOP
		this.objectTape[4].objects[0].position.y = cuboidDimentions/2;
		this.objectTape[4].objects[0].rotateX( this.angleToRadian(90) );
		//bottom
		this.objectTape[5].objects[0].position.y = -cuboidDimentions/2;
		this.objectTape[5].objects[0].rotateX( this.angleToRadian(90) );
		
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
export default threeCuboid;