import * as THREE from 'three';
import envelopGenerator from './envelopGenerator.js';					//Envelop Generator
import CCGenerator from './CCGenerator.js';								//Colour System
import timerObject from './timerObject.js';								//Timers
import pixelMaper from './pixelMaper.js';								//Pixel Maper
import animationObject from './animationObject.js';						//Generic Object Tracking class
import ElipticalEnvelopGenerator from './ElipticalEnvelopGenerator.js';
import heightMaper from './heightMaper.js';

class threeHeightMappedObject
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
		this.heightMapDimensions = [10, 10, 2];
		this.radius = 50;
		this.radiusScaller = 10;
		this.pathFiness = 50;
		this.drawHeightOn = 500;
		this.shiftTimer = 100;
		this.pulseSide = 1;
		this.bloomEnable = 0;
		this.bloomOn = 4;
		this.multiObject = 0;
		this.setUpStatus = 0;
		
		//Utility Objects
		this.pixelMap = new pixelMaper(2,2);
		this.heightMap = new heightMaper(2,2);
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
		this.heightMap = new heightMaper(this.heightMapDimensions[0],this.heightMapDimensions[1]);
		this.timers.addTimer("drawTimer");
		this.timers.startTimer("drawTimer", this.drawHeightOn);
		this.timers.addTimer("shiftTimer");
		this.timers.startTimer("shiftTimer", this.shiftTimer);
	}
	animate = function(colourIncrement, subColourIncrement, controlData, rotationalIncrements=[0,0,0])
	{
		if(this.setUpStatus==0){return;}
		var objectIndex, vertexIndex, vertecies, pointPos, curve, points, currentRadius = [0,0];
		var tempPoint = [ Math.round(Math.random()*this.heightMapDimensions[0]), Math.round(Math.random()*this.heightMapDimensions[1]) ];
		var localSpacing = controlData[7]*this.heightMapDimensions[2];
		var zStart = (localSpacing*this.heightMapDimensions[1])/2;
		
		//animae the height map on timer
		if(this.timers.hasTimedOut("drawTimer"))
		{
			this.heightMap.gradiatedPoint(tempPoint[0], tempPoint[1], 1*(controlData[4]+1), 100, 10*controlData[5]);
			this.timers.startTimer("drawTimer", this.drawHeightOn);
		}
		if(this.timers.hasTimedOut("shiftTimer"))
		{
			this.heightMap.shiftLeftRight([0, this.heightMapDimensions[0], 0, this.heightMapDimensions[1]], "right", 1);
			this.heightMap.subtractiveFade(controlData[2]);
			this.timers.startTimer("shiftTimer", this.shiftTimer*controlData[3]); 
		}
		
		
		for(objectIndex=0; objectIndex<this.heightMapDimensions[1]; objectIndex++)
		{
			vertecies = new Array();
			for(vertexIndex=0; vertexIndex<this.heightMapDimensions[0]; vertexIndex++)
			{
				if(this.pulseSide==1)
				{
					currentRadius[0] = (this.radius*controlData[0])+((this.radiusScaller*(this.heightMap.heightAt(vertexIndex, objectIndex)/100))*controlData[1]);
					currentRadius[1] = (this.radius*controlData[6])+((this.radiusScaller*(this.heightMap.heightAt(vertexIndex, objectIndex)/100))*controlData[1]);
				}
				else
				{
					currentRadius[0] = (this.radius*controlData[0])-((this.radiusScaller*(this.heightMap.heightAt(vertexIndex, objectIndex)/100))*controlData[1]);
					currentRadius[1] = (this.radius*controlData[6])-((this.radiusScaller*(this.heightMap.heightAt(vertexIndex, objectIndex)/100))*controlData[1]);
				}
				pointPos = this.pixelMap.getElipticalPointsRaw(0, 0, currentRadius[0], currentRadius[1], ((90/this.heightMapDimensions[0])*vertexIndex)+90+45);
				vertecies.push(new THREE.Vector2( pointPos[0], pointPos[1] ));
			}
			//vertecies.push(vertecies[0]);
			curve = new THREE.SplineCurve( vertecies );
			points = curve.getPoints(this.pathFiness);
			this.objectTape[objectIndex].geometry[0].setFromPoints( points );
			this.objectTape[objectIndex].objects[0].position.z = zStart-(localSpacing*objectIndex);
			//colour
			this.colourObject.getColour(this.subColourIndex%this.colourObject._bandWidth);
			this.objectTape[objectIndex].materials[0].color.r = this.colourObject._currentColour[0]/256;
			this.objectTape[objectIndex].materials[0].color.g = this.colourObject._currentColour[1]/256;
			this.objectTape[objectIndex].materials[0].color.b = this.colourObject._currentColour[2]/256;
			this.subColourIndex += subColourIncrement;
		}
		
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
		var objectIndex=0, vertexIndex, vertecies, pointPos, curve, points, currentRadius;
		var zStart = (this.heightMapDimensions[2]*this.heightMapDimensions[1])/2;
		//this.heightMap.gradiatedPoint(this.heightMapDimensions[0]/2, this.heightMapDimensions[1]/2, 2, 100, 20);
		var localGroup = new THREE.Object3D();
		
		for(objectIndex=0; objectIndex<this.heightMapDimensions[1]; objectIndex++)
		{
			this.objectTape.push( new animationObject() );
			this.objectTape[objectIndex].objectID = this.groupName+this.objectIDIndex;
			//create each face circle
			vertecies = new Array();
			for(vertexIndex=0; vertexIndex<this.heightMapDimensions[0]; vertexIndex++)
			{
				currentRadius = this.radius+(this.radiusScaller*(this.heightMap.heightAt(vertexIndex, objectIndex)/100));
				pointPos = this.pixelMap.getElipticalPointsRaw(0, 0, currentRadius, currentRadius, (360/this.heightMapDimensions[0])*vertexIndex);
				vertecies.push(new THREE.Vector2( pointPos[0], pointPos[1] ));
			}
			vertecies.push(vertecies[0]);
			curve = new THREE.SplineCurve( vertecies );
			points = curve.getPoints(this.pathFiness);
			this.objectTape[objectIndex].geometry.push( new THREE.BufferGeometry().setFromPoints( points ) );
			this.objectTape[objectIndex].materials.push( new THREE.LineBasicMaterial( {color: 0xffffff } ) );
			this.objectTape[objectIndex].materials[0].transparent = true;
			this.objectTape[objectIndex].materials[0].opacity = 1;
			this.objectTape[objectIndex].objects.push( new THREE.Line(this.objectTape[objectIndex].geometry[0], this.objectTape[objectIndex].materials[0]) );
			this.objectTape[objectIndex].objects[0].position.z = zStart-(this.heightMapDimensions[2]*objectIndex);
			if(this.bloomEnable==1)
			{
				if(objectIndex%this.bloomOn==this.bloomOn-1)
				{
					this.objectTape[objectIndex].objects[0].layers.enable( 1 );
				}
			}
			this.objectIDIndex++;
			//add to local group
			localGroup.add( this.objectTape[objectIndex].objects[0] );
		}
		
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
export default threeHeightMappedObject;