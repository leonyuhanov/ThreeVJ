import * as THREE from 'three';
import envelopGenerator from './envelopGenerator.js';					//Envelop Generator
import CCGenerator from './CCGenerator.js';								//Colour System
import timerObject from './timerObject.js';								//Timers
import pixelMaper from './pixelMaper.js';								//Pixel Maper
import animationObject from './animationObject.js';						//Generic Object Tracking class
import ElipticalEnvelopGenerator from './ElipticalEnvelopGenerator.js';

class threeOrbitalRings
{	
	constructor()
	{
		//Main object stores
		this.objectTape = new Array();
		this.globalGroupArray = new Array();
		this.globalObjectGroup = new THREE.Object3D();
		this.groupName = "OR_";
		this.objectIDIndex = 0;
		this.genObject = new animationObject();
		
		//Global Three Objects form main System
		this.scene;
		
		//Main properties
		this.origin = [0,0,0];
		this.radius = 10;
		this.maxRadius = 300;
		this.minRadius = 0;
		this.depth = 2;
		this.rotateTo = [0,0,0];
		this.direction = 0;
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
		var growthSpeed=0;
		
		this.textureMotion(controlData[1]);
		
		for(partIndex=0; partIndex<this.objectTape[objectIndex].objects.length; partIndex++)
		{
			growthSpeed = this.objectTape[objectIndex].extrude[partIndex]*controlData[1];
			if(this.direction==0)
			{
				if(this.objectTape[objectIndex].radius+growthSpeed<this.maxRadius)
				{
					this.objectTape[objectIndex].radius += growthSpeed;
				}
				else
				{
					this.objectTape[objectIndex].radius = this.minRadius;
				}
			}
			else
			{
				if(this.objectTape[objectIndex].radius-growthSpeed>this.minRadius)
				{
					this.objectTape[objectIndex].radius -= growthSpeed;
				}
				else
				{
					this.objectTape[objectIndex].radius = this.maxRadius;
				}
			}
			this.objectTape[objectIndex].objects[partIndex].scale.set(this.objectTape[objectIndex].radius*controlData[0], 1, this.objectTape[objectIndex].radius*controlData[0]);
			this.objectTape[objectIndex].materials[partIndex].opacity = 1-(this.objectTape[objectIndex].radius/this.maxRadius);
		}
		
		this.subColourIndex += colourControls[1];
		this.colourIndex += colourControls[0];
		
		this.globalObjectGroup.rotateX( (rotationalIncrements[0])*(Math.PI/180) );
		this.globalObjectGroup.rotateY( (rotationalIncrements[1])*(Math.PI/180) );
		this.globalObjectGroup.rotateZ( (rotationalIncrements[2])*(Math.PI/180) );	
	}
	textureMotion = function(speedScaler)
	{
		var objectIndex=0, partIndex=0;
		var localTexture;
		
		for(partIndex=0; partIndex<this.objectTape[objectIndex].materials.length; partIndex++)
		{
			localTexture = this.objectTape[objectIndex].canvasObject.getContext("2d");
			localTexture.fillStyle = "rgba(0,0,0,0.1)";
			localTexture.fillRect(0,0,this.objectTape[objectIndex].canvasObject.width, this.objectTape[objectIndex].canvasObject.height);
			this.objectTape[objectIndex].motionIncrements[0] += this.objectTape[objectIndex].extrude[partIndex]*speedScaler;
			this.colourObject.getRGBARounded( this.colourIndex%this.colourObject._bandWidth );
			localTexture.fillStyle = this.colourObject._rgba;
			localTexture.fillRect(this.objectTape[objectIndex].motionIncrements[0]%this.objectTape[objectIndex].canvasObject.width,0,10, this.objectTape[objectIndex].canvasObject.height);
			this.objectTape[objectIndex].texture.needsUpdate=true;
		}
	}
	insertObject = function()
	{
		var objectIndex=0, partIndex=0;
		
		var localGroup = new THREE.Object3D();
		
		this.objectTape.push( new animationObject() );
		this.objectTape[objectIndex].objectID = this.groupName+this.objectIDIndex;
		this.objectTape[objectIndex].radius = this.radius;
		this.objectTape[objectIndex].extrudeDepth = this.depth;
		this.objectTape[objectIndex].extrude.push( (Math.random()*2)+0.2 );
		this.objectTape[objectIndex].geometry.push( new THREE.CylinderGeometry(1, 1, this.objectTape[objectIndex].extrudeDepth, this.radialSegments, this.heightSegments, 1) );
		//texture
		this.objectTape[objectIndex].canvasObject = document.createElement('canvas');
		this.objectTape[objectIndex].canvasObject.width = 100;
		this.objectTape[objectIndex].canvasObject.height = 100;
		this.objectTape[objectIndex].canvasObject.style.backgroundColor='rgba(0,0,0,1)';
		this.objectTape[objectIndex].canvasObject.getContext("2d").fillStyle = 'rgba(0,0,0,1)';
		this.objectTape[objectIndex].canvasObject.getContext("2d").fillRect(0,0,this.objectTape[objectIndex].canvasObject.width,this.objectTape[objectIndex].canvasObject.height);
		this.objectTape[objectIndex].texture = new THREE.CanvasTexture(this.objectTape[objectIndex].canvasObject);
		this.objectTape[objectIndex].materials.push( new THREE.MeshLambertMaterial( {color: 0xffffff, side: THREE.DoubleSide, map: this.objectTape[objectIndex].texture} ) );
		this.objectTape[objectIndex].materials[partIndex].transparent = true;
		this.objectTape[objectIndex].materials[partIndex].opacity = 1;
		//colour
		//this.colourObject.getColour( this.colourIndex%this.colourObject._bandWidth );
		//this.objectTape[objectIndex].materials[partIndex].color.r = this.colourObject._currentColour[0]/255;
		//this.objectTape[objectIndex].materials[partIndex].color.g = this.colourObject._currentColour[1]/255;
		//this.objectTape[objectIndex].materials[partIndex].color.b = this.colourObject._currentColour[2]/255;
		
		this.objectTape[objectIndex].objects.push( new THREE.Mesh(this.objectTape[objectIndex].geometry[partIndex], this.objectTape[objectIndex].materials[partIndex]) );
		this.objectTape[objectIndex].objects[partIndex].scale.set(this.objectTape[objectIndex].radius, 1, this.objectTape[objectIndex].radius);
		//rotations
		this.objectTape[objectIndex].objects[partIndex].rotateX( this.angleToRadian( this.rotateTo[0] ) );
		this.objectTape[objectIndex].objects[partIndex].rotateY( this.angleToRadian( this.rotateTo[1] ) );
		this.objectTape[objectIndex].objects[partIndex].rotateZ( this.angleToRadian( this.rotateTo[2] ) );
		if(this.bloomEnable==1)
		{
			this.objectTape[objectIndex].objects[partIndex].layers.enable( 1 );
		}
		//add to local group
		localGroup.add( this.objectTape[objectIndex].objects[partIndex] );
			
		this.objectIDIndex++;
		//finalize objects
		this.globalGroupArray.push( localGroup );
		this.globalObjectGroup.add( localGroup );
		//Finalize position
		this.globalObjectGroup.position.x =  this.origin[0];
		this.globalObjectGroup.position.y =  this.origin[1];
		this.globalObjectGroup.position.z =  this.origin[2];
		//this.globalObjectGroup.rotateX( this.angleToRadian( this.rotateTo[0] ) );
		//this.globalObjectGroup.rotateY( this.angleToRadian( this.rotateTo[1] ) );
		//this.globalObjectGroup.rotateZ( this.angleToRadian( this.rotateTo[2] ) );
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
export default threeOrbitalRings;