import * as THREE from 'three';
import envelopGenerator from './envelopGenerator.js';					//Envelop Generator
import CCGenerator from './CCGenerator.js';								//Colour System
import timerObject from './timerObject.js';								//Timers
import pixelMaper from './pixelMaper.js';								//Pixel Maper
import animationObject from './animationObject.js';						//Generic Object Tracking class
import ElipticalEnvelopGenerator from './ElipticalEnvelopGenerator.js';

class threeCircularOrbits
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
		this.radius = 100;
		this.pollyRadius = 10
		this.pollyCount = 8;
		this.pollyFiness = 50;
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
		this.previousControlList = [0,0];
		
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
		if(this.setUpStatus==0){return;}
		var objectIndex=0;
		var pollyIndex, vertexIndex, vertecies, pointPos, pollyPos;
		var localOrbitRadius, localPollyRadius;
		var controleIndex=0, controlChange=0;
		var tempGeometry = new THREE.BufferGeometry();
		
		//check for control changes
		for(controleIndex=0; controleIndex<this.previousControlList.length; controleIndex++)
		{
			if(this.previousControlList[controleIndex]!=controlData[controleIndex])
			{
				this.previousControlList[controleIndex] = controlData[controleIndex];
				controlChange++;
			}
		}
		if(controlChange>0)
		{
			//create the 1st part
			vertecies = new Array();
			for(vertexIndex=0; vertexIndex<this.pollyFiness; vertexIndex++)
			{
				localPollyRadius = this.objectTape[objectIndex].subRadius * controlData[1];
				pollyPos = this.pixelMap.getElipticalPointsRaw(0, 0, localPollyRadius, localPollyRadius, ((360/this.pollyFiness)*vertexIndex));
				vertecies.push(new THREE.Vector3( pollyPos[0], pollyPos[1], 0 ));
			}
			tempGeometry.setFromPoints( vertecies );
			for(pollyIndex=0; pollyIndex<this.objectTape[objectIndex].pollyPoints; pollyIndex++)
			{
				//get this circles positio around teh centre point
				localOrbitRadius = this.objectTape[objectIndex].radius * controlData[0];
				pointPos = this.pixelMap.getElipticalPointsRaw(0, 0, localOrbitRadius, localOrbitRadius, ((360/this.objectTape[objectIndex].pollyPoints)*pollyIndex) );
				this.objectTape[objectIndex].geometry[pollyIndex].copy(tempGeometry);
				this.objectTape[objectIndex].objects[pollyIndex].position.set(pointPos[0], 0, pointPos[1]);
				
			}
		}
		//colours
		this.subColourIndex = this.colourIndex;
		for(pollyIndex=0; pollyIndex<this.objectTape[objectIndex].pollyPoints; pollyIndex++)
		{
			//colour
			this.colourObject.getColour(this.subColourIndex%this.colourObject._bandWidth);
			this.objectTape[objectIndex].materials[pollyIndex].color.r = this.colourObject._currentColour[0]/255;
			this.objectTape[objectIndex].materials[pollyIndex].color.g = this.colourObject._currentColour[1]/255;
			this.objectTape[objectIndex].materials[pollyIndex].color.b = this.colourObject._currentColour[2]/255;
			this.subColourIndex+=colourControls[1];
		}
		this.colourIndex += colourControls[0];
		
		this.globalObjectGroup.rotateX( (rotationalIncrements[0])*(Math.PI/180) );
		this.globalObjectGroup.rotateY( (rotationalIncrements[1])*(Math.PI/180) );
		this.globalObjectGroup.rotateZ( (rotationalIncrements[2])*(Math.PI/180) );	
	}
	insertObject = function()
	{
		var objectIndex=0, pollyIndex, vertexIndex, vertecies, pointPos, pollyPos;
		var localGroup = new THREE.Object3D();
		
		this.objectTape.push( new animationObject() );
		this.objectTape[objectIndex].objectID = this.groupName+this.objectIDIndex;
		this.objectTape[objectIndex].position = [this.origin[0], this.origin[1], this.origin[2]];
		this.objectTape[objectIndex].radius = this.radius;
		this.objectTape[objectIndex].subRadius = this.pollyRadius;
		this.objectTape[objectIndex].pollyPoints = this.pollyCount;
		//create each circle and position around a global circle
		for(pollyIndex=0; pollyIndex<this.pollyCount; pollyIndex++)
		{
			//get this circles positio around teh centre point
			pointPos = this.pixelMap.getElipticalPointsRaw(0, 0, this.radius, this.radius, (360/this.pollyCount)*pollyIndex);
			//create a polly
			vertecies = new Array();
			for(vertexIndex=0; vertexIndex<this.pollyFiness; vertexIndex++)
			{
				pollyPos = this.pixelMap.getElipticalPointsRaw(0, 0, this.pollyRadius, this.pollyRadius, (360/this.pollyFiness)*vertexIndex);
				vertecies.push(new THREE.Vector3( pollyPos[0], pollyPos[1], 0 ));
			}
			//vertecies.push(vertecies[0]);
			this.objectTape[objectIndex].geometry.push( new THREE.BufferGeometry().setFromPoints( vertecies ) );
			this.objectTape[objectIndex].materials.push( new THREE.LineBasicMaterial( {color: 0xffffff} ) );
			this.objectTape[objectIndex].materials[pollyIndex].transparent = true;
			this.objectTape[objectIndex].materials[pollyIndex].opacity = 1;
			this.objectTape[objectIndex].objects.push( new THREE.LineLoop(this.objectTape[objectIndex].geometry[pollyIndex], this.objectTape[objectIndex].materials[pollyIndex]) );
			this.objectTape[objectIndex].objects[pollyIndex].position.set(pointPos[0], 0, pointPos[1]);
			this.objectTape[objectIndex].objects[pollyIndex].rotateY( this.angleToRadian( (180-(360/this.pollyCount)*pollyIndex)) );
			if(this.bloomEnable==1)
			{
				this.objectTape[objectIndex].objects[pollyIndex].layers.enable( 1 );
			}
			//add to local group
			localGroup.add( this.objectTape[objectIndex].objects[pollyIndex] );
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
export default threeCircularOrbits;