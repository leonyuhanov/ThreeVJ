import * as THREE from 'three';
import envelopGenerator from './envelopGenerator.js';					//Envelop Generator
import CCGenerator from './CCGenerator.js';								//Colour System
import timerObject from './timerObject.js';								//Timers
import pixelMaper from './pixelMaper.js';								//Pixel Maper
import animationObject from './animationObject.js';						//Generic Object Tracking class
import ElipticalEnvelopGenerator from './ElipticalEnvelopGenerator.js';

class threeTouchCloud
{	
	constructor()
	{
		//Main object stores
		this.objectTape = new Array();
		this.globalGroupArray = new Array();
		this.globalObjectGroup = new THREE.Object3D();
		this.groupName = "TO_";
		this.objectIDIndex = 0;
		this.genObject = new animationObject();
		
		//Global Three Objects form main System
		this.scene;
		
		//Main properties
		this.origin = [0,0,0];
		this.dimensions = [100, 100];
		this.pointsPerObject = 360;
		this.TOFArray = new Array(this.pointsPerObject);
		this.dataCounter = 0;
		this.pointCloudArray = new Array(this.pointsPerObject);
		this.pointOpacity = 1;
		this.lfoSeed = 0;
		this.angleSeed = 0;
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
		this.rotateTo = [0,0,0];
		this.modify = 0;
		
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
		this.TOFArray.fill(0);
	}
	animate = function(colourControls, controlData, rotationalIncrements=[0,0,0])
	{
		//controlData[0] object scale
		//controlData[1] path width scale
		//controlData[2] path height scale
		//controlData[3] path depth scale
		//controlData[4] sensor 1
		//controlData[5] sensor 2
		//controlData[6] sensor 3
		//controlData[7] sensor 4
		
		if(this.setUpStatus==0){return;}
		
		var pointPos = [0,0], vertecies, vIndex=0, forceModifier=0
		var objectIndex=0;
		
		vertecies = new Array();
		for(vIndex=0; vIndex<this.pointsPerObject; vIndex++)
		{
			if(this.TOFArray[vIndex]>0)
			{
				forceModifier = (this.dimensions[0]/2)*((100-this.TOFArray[vIndex])/100);
			}
			else
			{
				forceModifier = 0;
			}
			pointPos = this.pixelMap.getElipticalPointsRaw(0, 0, this.dimensions[0]-forceModifier, this.dimensions[1]-forceModifier, (360/this.pointsPerObject)*vIndex);
			vertecies.push( new THREE.Vector3(pointPos[0], pointPos[1], 0) );
		}
		this.objectTape[objectIndex].geometry[0].setFromPoints( vertecies );
		//this.globalObjectGroup.remove( this.objectTape[objectIndex].objects[0] );
		//this.objectTape[objectIndex].geometry[0].setFromPoints( vertecies );
		//this.objectTape[objectIndex].objects[0] = new THREE.LineLoop(this.objectTape[objectIndex].geometry[0], this.objectTape[objectIndex].materials[0]);
		//bloom
		//if(this.bloomEnable==1)
		//{
		//	this.objectTape[objectIndex].objects[0].layers.enable( 1 );
		//}
		//this.globalObjectGroup.add( this.objectTape[objectIndex].objects[0] );
		
		
		//global Scale
		this.globalObjectGroup.scale.set(controlData[0]*controlData[1], controlData[0]*controlData[2], controlData[0]*controlData[3]);
		//global rotation
		this.globalObjectGroup.rotateX( (rotationalIncrements[0])*(Math.PI/180) );
		this.globalObjectGroup.rotateY( (rotationalIncrements[1])*(Math.PI/180) );
		this.globalObjectGroup.rotateZ( (rotationalIncrements[2])*(Math.PI/180) );	

		this.colourIndex += colourControls[0];
		this.subColourIndex = this.colourIndex;
	}
	updateTOFArray = function(TOFData)
	{
		/*
			0 = gyro
			1 = 4
			2 = 3
			3 = 2
			4 = 1
			
		*/
		if(TOFData.length==0)
		{
			return;
		}
		var anngularIncrement=90, tofIndex=0, tofDataIndex;
		//test
		for(tofDataIndex=0; tofDataIndex<4; tofDataIndex++)
		{
			tofIndex = (360-(Math.round( ((tofDataIndex)*anngularIncrement)+Math.round(TOFData[4]) )))%360;
			this.TOFArray[ tofIndex ] = parseInt(TOFData[tofDataIndex]); 
		}
		this.dataCounter++;
	}
	decayTOFArray = function(decayBy)
	{
		var decayAmount = this.dimensions[0]*decayBy;
		var tofIndex=0;
		
		for(tofIndex=0; tofIndex<this.TOFArray.length; tofIndex++)
		{
			if(decayAmount<this.TOFArray[tofIndex])
			{
				this.TOFArray[tofIndex]-=decayAmount;
			}
			else
			{
				this.TOFArray[tofIndex] = 0;
			}
		}
	}
	insertObject = function()
	{
		var objectIndex=0, partIndex=1, pointIndex=0, vertecies;
		var pointPos = [0,0];
		var localDims = [0,0]
		var localGroup = new THREE.Object3D();
		
		this.subColourIndex = this.colourIndex;
		for(objectIndex=0; objectIndex<partIndex; objectIndex++)
		{
			this.objectTape.push( new animationObject() );
			this.objectTape[objectIndex].objectID = this.groupName+this.objectIDIndex;
			vertecies = new Array();
			for(pointIndex=0; pointIndex<this.pointsPerObject; pointIndex++)
			{
				pointPos = this.pixelMap.getElipticalPointsRaw(0, 0, this.dimensions[0], this.dimensions[1], (360/this.pointsPerObject)*pointIndex);
				vertecies.push( new THREE.Vector3(pointPos[0], pointPos[1], 0) );
			}
			this.objectTape[objectIndex].geometry.push( new THREE.BufferGeometry().setFromPoints(  vertecies ) );
			this.objectTape[objectIndex].materials.push( new THREE.PointsMaterial( {color: 0xffffff} ) );
			this.objectTape[objectIndex].materials[0].transparent = true;
			this.objectTape[objectIndex].materials[0].opacity = this.pointOpacity;
			//colour
			this.colourObject.getColour( this.subColourIndex%this.colourObject._bandWidth );
			this.objectTape[objectIndex].materials[0].color.r = this.colourObject._currentColour[0]/255;
			this.objectTape[objectIndex].materials[0].color.g = this.colourObject._currentColour[1]/255;
			this.objectTape[objectIndex].materials[0].color.b = this.colourObject._currentColour[2]/255;
			this.objectTape[objectIndex].objects.push( new THREE.Points(this.objectTape[objectIndex].geometry[0], this.objectTape[objectIndex].materials[0]) );
			//bloom
			if(this.bloomEnable==1)
			{
				this.objectTape[objectIndex].objects[0].layers.enable( 1 );
			}
			localGroup.add( this.objectTape[objectIndex].objects[0] );
			this.objectIDIndex++;
			this.subColourIndex+=20;
		}		
		
		//rotations
		localGroup.rotateX( this.angleToRadian( this.rotateTo[0] ) );
		localGroup.rotateY( this.angleToRadian( this.rotateTo[1] ) );
		localGroup.rotateZ( this.angleToRadian( this.rotateTo[2] ) );
		
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
export default threeTouchCloud;