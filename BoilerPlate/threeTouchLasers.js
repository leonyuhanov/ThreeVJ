import * as THREE from 'three';
import envelopGenerator from './envelopGenerator.js';					//Envelop Generator
import CCGenerator from './CCGenerator.js';								//Colour System
import timerObject from './timerObject.js';								//Timers
import pixelMaper from './pixelMaper.js';								//Pixel Maper
import animationObject from './animationObject.js';						//Generic Object Tracking class
import ElipticalEnvelopGenerator from './ElipticalEnvelopGenerator.js';

class threeTouchLasers
{	
	constructor()
	{
		//Main object stores
		this.objectTape = new Array();
		this.globalGroupArray = new Array();
		this.globalObjectGroup = new THREE.Object3D();
		this.groupName = "TL_";
		this.objectIDIndex = 0;
		this.genObject = new animationObject();
		
		//Global Three Objects form main System
		this.scene;
		
		//Main properties
		this.origin = [0,0,0];
		this.dimensions = [100, 100];
		this.innerGap = 20;
		this.pointsPerObject = 360;
		this.laserDimenisions = [1,1,10];
		this.numberOFLasers = 1;
		this.maxLaserPullVelocity = 5;
		this.TOFArray = new Array(this.pointsPerObject);
		this.currentPeak = 0;
		this.dataCounter = 0;
		this.laserOpacity = 1;
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
		//controlData[4] laser motion speed scaler
		
		if(this.setUpStatus==0){return;}
		
		var objectIndex=0, partIndex=0, laserSpeed=0;
		var pointPos = [0,0];
		
		for(objectIndex=0; objectIndex<this.pointsPerObject; objectIndex++)
		{
			for(partIndex=0; partIndex<this.numberOFLasers; partIndex++)
			{
				//check to see if moving it OUT to the boundary will hit the boundary
				if( (this.TOFArray[objectIndex]/100)>0)
				{
					laserSpeed = (controlData[4]*this.objectTape[objectIndex].extrude[partIndex][1])+(this.maxLaserPullVelocity*(1-(this.TOFArray[objectIndex]/100)));
				}
				else
				{
					laserSpeed = (controlData[4]*this.objectTape[objectIndex].extrude[partIndex][1]);
				}
				
				if(this.objectTape[objectIndex].extrude[partIndex][0]+laserSpeed>this.dimensions[0])
				{
					this.objectTape[objectIndex].extrude[partIndex][0] = this.innerGap;
				}
				else
				{
					this.objectTape[objectIndex].extrude[partIndex][0]+=laserSpeed;
				}
				//calculate objects position based on its path location
				pointPos = this.pixelMap.getElipticalPointsRaw(0, 0, this.objectTape[objectIndex].extrude[partIndex][0], this.objectTape[objectIndex].extrude[partIndex][0], (360/this.pointsPerObject)*objectIndex);
				this.objectTape[objectIndex].objects[partIndex].position.set(pointPos[0], pointPos[1], 0 ); //this.origin[2]+ (50-(Math.random()*100))*(this.TOFArray[objectIndex]/100)
				this.objectTape[objectIndex].materials[partIndex].opacity = (this.TOFArray[objectIndex]/100)+0.1;
			}
		}
		
		
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
	peakDetect = function()
	{
		var maxValue = 0, tofIndex = 0, maxIndex=0;
		for(tofIndex=0; tofIndex<this.TOFArray.length; tofIndex++)
		{
			if(this.TOFArray[tofIndex]>maxValue)
			{
				maxValue = this.TOFArray[tofIndex];
				maxIndex = tofIndex;
			}
		}
		this.currentPeak = maxIndex;
	}
	insertObject = function()
	{
		var objectIndex=0, partIndex=0, pointIndex=0;
		var pointPos = [0,0];
		var localDims = [0,0]
		var localGroup = new THREE.Object3D();
		
		this.subColourIndex = this.colourIndex;
		//one object per angular point
		for(objectIndex=0; objectIndex<this.pointsPerObject; objectIndex++)
		{
			this.objectTape.push( new animationObject() );
			this.objectTape[objectIndex].objectID = this.groupName+this.objectIDIndex;
			//number of laser beams
			for(partIndex=0; partIndex<this.numberOFLasers; partIndex++)
			{
				//this lasers random start location on its anglular path and speed
				this.objectTape[objectIndex].extrude.push( [Math.random()*this.dimensions[0], (Math.random()*1)+0.0001] );
				this.objectTape[objectIndex].geometry.push( new THREE.BoxGeometry(this.laserDimenisions[0], this.laserDimenisions[1], this.laserDimenisions[2], 1, 1, 1) );
				this.objectTape[objectIndex].materials.push( new THREE.MeshLambertMaterial( {color: 0xffffff} ) );
				this.objectTape[objectIndex].materials[partIndex].transparent = true;
				this.objectTape[objectIndex].materials[partIndex].opacity = this.laserOpacity;
				//colour
				this.colourObject.getColour( this.subColourIndex%this.colourObject._bandWidth );
				this.objectTape[objectIndex].materials[partIndex].color.r = this.colourObject._currentColour[0]/255;
				this.objectTape[objectIndex].materials[partIndex].color.g = this.colourObject._currentColour[1]/255;
				this.objectTape[objectIndex].materials[partIndex].color.b = this.colourObject._currentColour[2]/255;
				this.objectTape[objectIndex].objects.push( new THREE.Mesh(this.objectTape[objectIndex].geometry[partIndex], this.objectTape[objectIndex].materials[partIndex]) );
				//Position within its angualr path
				pointPos = this.pixelMap.getElipticalPointsRaw(0, 0, this.objectTape[objectIndex].extrude[partIndex][0], this.objectTape[objectIndex].extrude[partIndex][0], (360/this.pointsPerObject)*objectIndex);
				this.objectTape[objectIndex].objects[partIndex].position.set(pointPos[0],pointPos[1],this.origin[2]);
				//Scale
				this.objectTape[objectIndex].objects[partIndex].scale.set(1,1,1);
				//rotation
				this.objectTape[objectIndex].objects[partIndex].rotateX( this.angleToRadian(90) );
				this.objectTape[objectIndex].objects[partIndex].rotateY( this.angleToRadian((360/this.pointsPerObject)*objectIndex) );
				//bloom
				if(this.bloomEnable==1)
				{
					this.objectTape[objectIndex].objects[partIndex].layers.enable( 1 );
				}
				//add to local group
				localGroup.add( this.objectTape[objectIndex].objects[partIndex] );
			}
			this.objectIDIndex++;
			this.subColourIndex++;
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
export default threeTouchLasers;