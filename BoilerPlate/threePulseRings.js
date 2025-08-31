import * as THREE from 'three';
import envelopGenerator from './envelopGenerator.js';					//Envelop Generator
import CCGenerator from './CCGenerator.js';								//Colour System
import timerObject from './timerObject.js';								//Timers
import pixelMaper from './pixelMaper.js';								//Pixel Maper
import animationObject from './animationObject.js';						//Generic Object Tracking class
import ElipticalEnvelopGenerator from './ElipticalEnvelopGenerator.js';

class threePulseRings
{	
	constructor()
	{
		//Main object stores
		this.objectTape = new Array();
		this.globalGroupArray = new Array();
		this.globalObjectGroup = new THREE.Object3D();
		this.groupName = "PR_";
		this.objectIDIndex = 0;
		this.genObject = new animationObject();
		
		//Global Three Objects form main System
		this.scene;
		
		//Main properties
		this.origin = [0,0,0];
		this.pulseLength = 100;
		this.ringCount = 1;
		this.ringRadius = 20;
		this.ringRadiusWobble = 5;
		this.ringLength = 180;
		this.ringWidth = 10;
		this.bloomOn = 3;
		this.rotateTo = [0,0,0];
		this.radialSegments = 100;
		this.heightSegments = this.radialSegments/2;
		this.bloomEnable = 0;
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
	}
	animate = function(colourControls, controlData, rotationalIncrements=[0,0,0])
	{
		//controlData[0] object scale
		//controlData[1] motion speed scale
		if(this.setUpStatus==0){return;}
		
		var objectIndex=0, partIndex=0;
		var localLength = this.pulseLength*controlData[0];
		var motionSpeed=0;
		
		for(partIndex=0; partIndex<this.objectTape[objectIndex].pollyPoints; partIndex++)
		{
			this.objectTape[objectIndex].objects[partIndex].rotateY( this.angleToRadian( (this.objectTape[objectIndex].extrude[partIndex][0]*this.objectTape[objectIndex].extrude[partIndex][3])* controlData[1] ) );
			motionSpeed = this.objectTape[objectIndex].extrude[partIndex][1]*controlData[2];
			//forward motion this.objectTape[objectIndex].extrude[partIndex][2]==0
			if(this.objectTape[objectIndex].extrude[partIndex][2]==0)
			{		
				if(this.objectTape[objectIndex].objects[partIndex].position.z+motionSpeed<(localLength/2))
				{
					this.objectTape[objectIndex].objects[partIndex].position.z += motionSpeed;
				}
				else
				{
					this.objectTape[objectIndex].objects[partIndex].position.z = -(localLength/2);
				}
			}
			//backwards motion
			else
			{
				if(this.objectTape[objectIndex].objects[partIndex].position.z-motionSpeed>-(localLength/2))
				{
					this.objectTape[objectIndex].objects[partIndex].position.z -= motionSpeed;
				}
				else
				{
					this.objectTape[objectIndex].objects[partIndex].position.z = (localLength/2);
				}
			}
			//object scale
			this.objectTape[objectIndex].objects[partIndex].scale.set(this.objectTape[objectIndex].radius*controlData[0],1,this.objectTape[objectIndex].radius*controlData[0]);
			//colour
			/*
			this.colourObject.getColour( this.subColourIndex%this.colourObject._bandWidth );
			this.objectTape[objectIndex].materials[partIndex].color.r = this.colourObject._currentColour[0]/255;
			this.objectTape[objectIndex].materials[partIndex].color.g = this.colourObject._currentColour[1]/255;
			this.objectTape[objectIndex].materials[partIndex].color.b = this.colourObject._currentColour[2]/255;
			*/
			this.subColourIndex += colourControls[1];
		}
		this.textureMotion(controlData[3], colourControls)
		//this.colourIndex += colourControls[0];
		//this.subColourIndex = this.colourIndex;
		
		this.globalObjectGroup.rotateX( (rotationalIncrements[0])*(Math.PI/180) );
		this.globalObjectGroup.rotateY( (rotationalIncrements[1])*(Math.PI/180) );
		this.globalObjectGroup.rotateZ( (rotationalIncrements[2])*(Math.PI/180) );	
	}
	textureMotion = function(speedScaler, colourControls)
	{
		var objectIndex=0, partIndex=0, pointIndex=0;
		var localTexture;
		
		for(partIndex=0; partIndex<this.objectTape[objectIndex].materials.length; partIndex++)
		{
			localTexture = this.objectTape[objectIndex].canvasObject[partIndex].getContext("2d");
			//localTexture.fillStyle = "rgba(0,0,0,0.01)";
			//localTexture.fillRect(0,0,this.objectTape[objectIndex].canvasObject[partIndex].width,this.objectTape[objectIndex].canvasObject[partIndex].height);
			this.colourObject.getRGBARounded( this.subColourIndex%this.colourObject._bandWidth );
			this.subColourIndex += colourControls[1];
			localTexture.fillStyle = this.colourObject._rgba;
			this.objectTape[objectIndex].extrude[partIndex][6] += Math.round(this.objectTape[objectIndex].extrude[partIndex][5]*speedScaler);
			localTexture.fillRect(this.objectTape[objectIndex].extrude[partIndex][6]%this.objectTape[objectIndex].canvasObject[partIndex].width,0,20, this.objectTape[objectIndex].canvasObject[partIndex].height);
			this.objectTape[objectIndex].texture[partIndex].needsUpdate=true;
		}
		this.colourIndex += colourControls[0];
		this.subColourIndex = this.colourIndex;
	}
	insertObject = function()
	{
		var objectIndex=0, partIndex=0;
		
		var localGroup = new THREE.Object3D();
		
		this.objectTape.push( new animationObject() );
		this.objectTape[objectIndex].objectID = this.groupName+this.objectIDIndex;
		this.objectTape[objectIndex].radius = this.ringRadius;
		this.objectTape[objectIndex].pollyPoints = this.ringCount;
		this.objectTape[objectIndex].texture = new Array();
		this.objectTape[objectIndex].canvasObject = new Array();

		for(partIndex=0; partIndex<this.objectTape[objectIndex].pollyPoints; partIndex++)
		{
			this.generatedirectionalVectors();
			//Rotation Spped, motion speed, motion direction, wobbledirection, wobbleamount, texture points
			this.objectTape[objectIndex].extrude.push( [(Math.random()*1)+0.25, (Math.random()*1)+0.25, Math.round(Math.random()), this.directionalVectors[0], Math.random()*this.ringRadiusWobble, (Math.random()*5)+1, 0] );
			this.objectTape[objectIndex].geometry.push( new THREE.CylinderGeometry(1, 1, this.ringWidth, this.radialSegments, this.heightSegments, 1, 0, this.angleToRadian( (Math.random()*this.ringLength)+20 )) );
			//texture
			
			this.objectTape[objectIndex].canvasObject.push( document.createElement('canvas') );
			this.objectTape[objectIndex].canvasObject[partIndex].width = 100;
			this.objectTape[objectIndex].canvasObject[partIndex].height = 100;
			this.objectTape[objectIndex].canvasObject[partIndex].style.backgroundColor='rgba(0,0,0,1)';
			this.objectTape[objectIndex].canvasObject[partIndex].getContext("2d").fillStyle = 'rgba(0,0,0,1)';
			this.objectTape[objectIndex].canvasObject[partIndex].getContext("2d").fillRect(0,0,this.objectTape[objectIndex].canvasObject[partIndex].width,this.objectTape[objectIndex].canvasObject[partIndex].height);
			this.objectTape[objectIndex].texture.push( new THREE.CanvasTexture(this.objectTape[objectIndex].canvasObject[partIndex]) );
			
			this.objectTape[objectIndex].materials.push( new THREE.MeshLambertMaterial( {color: 0xffffff, side: THREE.DoubleSide, map: this.objectTape[objectIndex].texture[partIndex]} ) );
			this.objectTape[objectIndex].materials[partIndex].transparent = true;
			this.objectTape[objectIndex].materials[partIndex].opacity = 1;
			//colour
			this.colourObject.getColour( (this.colourIndex+(10*partIndex))%this.colourObject._bandWidth );
			this.objectTape[objectIndex].materials[partIndex].color.r = this.colourObject._currentColour[0]/255;
			this.objectTape[objectIndex].materials[partIndex].color.g = this.colourObject._currentColour[1]/255;
			this.objectTape[objectIndex].materials[partIndex].color.b = this.colourObject._currentColour[2]/255;
			this.objectTape[objectIndex].objects.push( new THREE.Mesh(this.objectTape[objectIndex].geometry[partIndex], this.objectTape[objectIndex].materials[partIndex]) );
			this.objectTape[objectIndex].objects[partIndex].scale.set(this.objectTape[objectIndex].radius*(this.objectTape[objectIndex].extrude[partIndex][4]*this.objectTape[objectIndex].extrude[partIndex][3]), 1, this.objectTape[objectIndex].radius*(this.objectTape[objectIndex].extrude[partIndex][4]*this.objectTape[objectIndex].extrude[partIndex][3]));
			this.objectTape[objectIndex].objects[partIndex].position.set(this.origin[0], this.origin[1], (this.origin[2]-(this.pulseLength/2))+((this.pulseLength/this.objectTape[objectIndex].pollyPoints)*partIndex) );
			this.objectTape[objectIndex].objects[partIndex].rotateZ( this.angleToRadian( 90 ) );
			this.objectTape[objectIndex].objects[partIndex].rotateX( this.angleToRadian( 90 ) );
			this.objectTape[objectIndex].objects[partIndex].rotateY( this.angleToRadian( Math.random()*360 ) );
			//rotations
			this.objectTape[objectIndex].objects[partIndex].rotateX( this.angleToRadian( this.rotateTo[0] ) );
			this.objectTape[objectIndex].objects[partIndex].rotateY( this.angleToRadian( this.rotateTo[1] ) );
			this.objectTape[objectIndex].objects[partIndex].rotateZ( this.angleToRadian( this.rotateTo[2] ) );
			if(this.bloomEnable==1)
			{
				if(partIndex%(this.bloomOn)==this.bloomOn-1)
				{
					this.objectTape[objectIndex].objects[partIndex].layers.enable( 1 );
				}
			}
			//add to local group
			localGroup.add( this.objectTape[objectIndex].objects[partIndex] );
		}

		this.objectIDIndex++;
		//finalize objects
		this.globalGroupArray.push( localGroup );
		this.globalObjectGroup.add( localGroup );
		//Finalize position
		this.globalObjectGroup.position.x =  this.origin[0];
		this.globalObjectGroup.position.y =  this.origin[1];
		this.globalObjectGroup.position.z =  this.origin[2];
		//add to global scene
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
export default threePulseRings;