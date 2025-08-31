import * as THREE from 'three';
import envelopGenerator from './envelopGenerator.js';					//Envelop Generator
import CCGenerator from './CCGenerator.js';								//Colour System
import timerObject from './timerObject.js';								//Timers
import pixelMaper from './pixelMaper.js';								//Pixel Maper
import animationObject from './animationObject.js';						//Generic Object Tracking class
import ElipticalEnvelopGenerator from './ElipticalEnvelopGenerator.js';

class threePollySpheres
{	
	constructor()
	{
		//Main object stores
		this.objectTape = new Array();
		this.globalGroupArray = new Array();
		this.globalObjectGroup = new THREE.Object3D();
		this.groupName = "PS_";
		this.objectIDIndex = 0;
		this.genObject = new animationObject();
		
		//Global Three Objects form main System
		this.scene;
		
		//Main properties
		this.origin = [0,0,0];
		this.dimensions = [100,100];
		this.pollyCount = 10;
		this.pointsPerPolly = 6;
		this.cloudPointsPerPolly = 50;
		this.cloudTightness = [5,5,5];
		this.pointFiness = 100;
		this.lineOpacity = 0.2;
		this.subLineOpacity = 1; 
		this.lfoSeed = 0;
		this.angleSeed = 0;
		this.bloomEnable = 0;
		this.subBloomEnable = 1;
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
		//this.previousControls = [1,1,1];
		
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
		//controlData[1] path width scale
		//controlData[2] path height scale
		//controlData[3] polly motion increment
		
		if(this.setUpStatus==0){return;}
		var objectIndex=0, pointPos, subPartIndex=this.pollyCount, pIndex=0, vertecies, zAngle, pointSpot = new THREE.Vector2(0,0), partIndex=0;
		var pollyIndexArray = new Array();
		var localScale = [controlData[0]*controlData[1], controlData[0]*controlData[2], 1];
		
		for(objectIndex=0; objectIndex<this.pollyCount; objectIndex++)
		{
			if(this.objectTape[objectIndex].extrude[0]+controlData[3]<=180)
			{
				this.objectTape[objectIndex].extrude[0] += controlData[3];
			}
			else
			{
				this.objectTape[objectIndex].extrude[0] = 0;
			}
			pointPos = this.pixelMap.getElipticalPointsRaw(0,0,this.dimensions[0]*localScale[0], this.dimensions[1]*localScale[1], this.objectTape[objectIndex].extrude[0]);
			this.objectTape[objectIndex].objects[0].position.z = pointPos[1];
			this.objectTape[objectIndex].objects[0].scale.set((pointPos[0]/this.dimensions[0])*localScale[0], (pointPos[0]/this.dimensions[1])*localScale[1], 1);
			this.objectTape[objectIndex].materials[0].opacity = this.lineOpacity;
 		}
		//grab order of pollys
		pollyIndexArray = this.conectionOrder();
		for(pIndex=0; pIndex<this.pointsPerPolly; pIndex++)
		{
			vertecies = new Array();
			for(objectIndex=0; objectIndex<this.pollyCount; objectIndex++)
			{
				//locate the pollys Z location via Y and scale via (X/dimenions)
				//zAngle = this.objectTape[objectIndex].extrude[0];
				zAngle = this.objectTape[ pollyIndexArray[objectIndex] ].extrude[0];
				pointPos = this.pixelMap.getElipticalPointsRaw(0,0,this.dimensions[0]*localScale[0], this.dimensions[1]*localScale[1], zAngle);
				this.objectTape[objectIndex].shape[0].getPoint(pIndex/this.pointsPerPolly, pointSpot);
				vertecies.push( new THREE.Vector3(pointSpot.x*(pointPos[0]/this.dimensions[0])*localScale[0], pointSpot.y*(pointPos[0]/this.dimensions[1])*localScale[1], pointPos[1]) );
			}
			this.globalObjectGroup.remove( this.objectTape[subPartIndex].objects[partIndex] );
			this.objectTape[subPartIndex].geometry[partIndex].setFromPoints( vertecies );
			this.objectTape[subPartIndex].materials[partIndex].opacity = this.subLineOpacity;
			this.objectTape[subPartIndex].objects[partIndex] = new THREE.Line(this.objectTape[subPartIndex].geometry[partIndex], this.objectTape[subPartIndex].materials[partIndex]);
			//bloom
			if(this.subBloomEnable==1)
			{
				this.objectTape[subPartIndex].objects[partIndex].layers.enable( 1 );
			}
			this.globalObjectGroup.add( this.objectTape[subPartIndex].objects[partIndex] );
			partIndex++;
		}


		this.globalObjectGroup.rotateX( (rotationalIncrements[0])*(Math.PI/180) );
		this.globalObjectGroup.rotateY( (rotationalIncrements[1])*(Math.PI/180) );
		this.globalObjectGroup.rotateZ( (rotationalIncrements[2])*(Math.PI/180) );	

		this.colourIndex += colourControls[0];
		this.subColourIndex = this.colourIndex;

	}
	conectionOrder = function()
	{
		var indexArray = new Array(), tempArray = new Array();
		var objectIndex, minValue=360, minIndex=0;
		
		for(objectIndex=0; objectIndex<this.pollyCount; objectIndex++)
		{
			tempArray.push( this.objectTape[objectIndex].extrude[0] );
		}
		while(tempArray.length>0)
		{
			//find smallest value
			minValue=360;
			minIndex=0;
			for(objectIndex=0; objectIndex<tempArray.length; objectIndex++)
			{
				if(minValue>tempArray[objectIndex])
				{
					minValue = tempArray[objectIndex];
					minIndex = objectIndex;
				}
			}
			indexArray.push(minValue);
			tempArray.splice(minIndex,1);
		}
		tempArray = new Array();
		for(objectIndex=0; objectIndex<indexArray.length; objectIndex++)
		{
			for(minIndex=0; minIndex<this.pollyCount; minIndex++)
			{
				if(indexArray[objectIndex]==this.objectTape[minIndex].extrude[0])
				{
					tempArray.push(minIndex);
				}
			}
		}
		return tempArray;
	}
	insertObject = function()
	{
		var objectIndex=0, partIndex=0, subPartIndex=this.pollyCount, vertecies;
		var pIndex=0, pointLocation = [0,0,0], pointSpot = new THREE.Vector2(0,0);
		var pointPos = [0,0], zAngle=0;
		var localGroup = new THREE.Object3D();
		
		this.subColourIndex = this.colourIndex;
		for(objectIndex=0; objectIndex<this.pollyCount; objectIndex++)
		{
			this.objectTape.push( new animationObject() );
			this.objectTape[objectIndex].objectID = this.groupName+this.objectIDIndex;
			//locate the pollys Z location via Y and scale via (X/dimenions)
			zAngle = (180/this.pollyCount)*objectIndex;
			this.objectTape[objectIndex].extrude.push(zAngle);
			pointPos = this.pixelMap.getElipticalPointsRaw(0,0,this.dimensions[0], this.dimensions[1], zAngle);
			//create the Polly shape
			this.objectTape[objectIndex].shape.push( new THREE.EllipseCurve(0, 0, this.dimensions[0], this.dimensions[0], 0,  2 * Math.PI, false, 0) );
			this.objectTape[objectIndex].geometry.push( new THREE.BufferGeometry().setFromPoints(  this.objectTape[objectIndex].shape[0].getPoints( this.pointsPerPolly ) ) );
			this.objectTape[objectIndex].materials.push( new THREE.LineBasicMaterial( {color: 0xffffff} ) );
			this.objectTape[objectIndex].materials[0].transparent = true;
			this.objectTape[objectIndex].materials[0].opacity = this.lineOpacity;
			//colour
			this.colourObject.getColour( this.subColourIndex%this.colourObject._bandWidth );
			this.objectTape[objectIndex].materials[0].color.r = this.colourObject._currentColour[0]/255;
			this.objectTape[objectIndex].materials[0].color.g = this.colourObject._currentColour[1]/255;
			this.objectTape[objectIndex].materials[0].color.b = this.colourObject._currentColour[2]/255;
			this.subColourIndex+=(2*objectIndex);
			this.objectTape[objectIndex].objects.push( new THREE.LineLoop(this.objectTape[objectIndex].geometry[0], this.objectTape[objectIndex].materials[0]) );
			//set Z poistion
			this.objectTape[objectIndex].objects[0].position.z = pointPos[1];
			//set objects scale based on position
			this.objectTape[objectIndex].objects[0].scale.set(pointPos[0]/this.dimensions[0], pointPos[0]/this.dimensions[1], 1);
			//bloom
			if(this.bloomEnable==1)
			{
				this.objectTape[objectIndex].objects[partIndex].layers.enable( 1 );
			}
			localGroup.add( this.objectTape[objectIndex].objects[partIndex] );
			this.objectIDIndex++;
		}
		//create face lines conecting each vertex
		this.subColourIndex = this.colourIndex;
		this.objectTape.push( new animationObject() );
		this.objectTape[subPartIndex].objectID = this.groupName+this.objectIDIndex;
		partIndex=0;
		for(pIndex=0; pIndex<this.pointsPerPolly; pIndex++)
		{
			vertecies = new Array();
			for(objectIndex=0; objectIndex<this.pollyCount; objectIndex++)
			{
				//locate the pollys Z location via Y and scale via (X/dimenions)
				zAngle = (180/this.pollyCount)*objectIndex;
				pointPos = this.pixelMap.getElipticalPointsRaw(0,0,this.dimensions[0], this.dimensions[1], zAngle);
				this.objectTape[objectIndex].shape[0].getPoint(pIndex/this.pointsPerPolly, pointSpot);
				vertecies.push( new THREE.Vector3(pointSpot.x*(pointPos[0]/this.dimensions[0]), pointSpot.y*(pointPos[0]/this.dimensions[1]), pointPos[1]) );
			}
			this.objectTape[subPartIndex].geometry.push( new THREE.BufferGeometry().setFromPoints(  vertecies ) );
			this.objectTape[subPartIndex].materials.push( new THREE.LineBasicMaterial( {color: 0xffff00} ) );
			this.objectTape[subPartIndex].materials[partIndex].transparent = true;
			this.objectTape[subPartIndex].materials[partIndex].opacity = this.subLineOpacity;
			//colour
			this.colourObject.getColour( this.subColourIndex%this.colourObject._bandWidth );
			this.objectTape[subPartIndex].materials[partIndex].color.r = this.colourObject._currentColour[0]/255;
			this.objectTape[subPartIndex].materials[partIndex].color.g = this.colourObject._currentColour[1]/255;
			this.objectTape[subPartIndex].materials[partIndex].color.b = this.colourObject._currentColour[2]/255;
			this.subColourIndex+=(5*pIndex);
			this.objectTape[subPartIndex].objects.push( new THREE.Line(this.objectTape[subPartIndex].geometry[partIndex], this.objectTape[subPartIndex].materials[partIndex]) );
			//bloom
			if(this.subBloomEnable==1)
			{
				this.objectTape[subPartIndex].objects[partIndex].layers.enable( 1 );
			}
			localGroup.add( this.objectTape[subPartIndex].objects[partIndex] );
			partIndex++;
			this.objectIDIndex++;
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
export default threePollySpheres;