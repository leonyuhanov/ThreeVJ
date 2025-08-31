import * as THREE from 'three';
import envelopGenerator from './envelopGenerator.js';					//Envelop Generator
import CCGenerator from './CCGenerator.js';								//Colour System
import timerObject from './timerObject.js';								//Timers
import pixelMaper from './pixelMaper.js';								//Pixel Maper
import animationObject from './animationObject.js';						//Generic Object Tracking class
import ElipticalEnvelopGenerator from './ElipticalEnvelopGenerator.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';
import { LineSegments2 } from 'three/addons/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/addons/lines/LineSegmentsGeometry.js';
import { Line2 } from 'three/addons/lines/Line2.js';
import { LineGeometry } from 'three/addons/lines/LineGeometry.js';

class threeCurveLines
{	
	constructor()
	{
		//Main object stores
		this.objectTape = new Array();
		this.globalGroupArray = new Array();
		this.globalObjectGroup = new THREE.Object3D();
		this.groupName = "CL_";
		this.objectIDIndex = 0;
		this.genObject = new animationObject();
		
		//Global Three Objects form main System
		this.scene;
		
		//Main properties
		this.origin = [0,0,0];
		this.pointSize = 10;
		this.lineLength = 50;
		this.pollyFitness = 50;
		this.lines = 1;
		this.lineSegments = 3;
		this.opacity = 1;
		this.bloomEnable = 0;
		this.bloomSegments = [0,1,1];
		this.multiObject = 0;
		this.setUpStatus = 0;
		
		//Utility Objects
		this.pixelMap = new pixelMaper(2,2);
		this.screenRange = [100,100,100];
		this.timers = new timerObject();
		this.envelops = new envelopGenerator();
		this.lfo = new ElipticalEnvelopGenerator();
		this.directionalVectors = [1,1,1];
		this.rotateTo = [0,0,0];
		this.modify = 0;
		
		//Colour System
		this.colourIndex = 0;
		this.subColourIndex = 0;
		this.creationColourIncrement = 10;
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
		//controlData[0]  object scale
		//controlData[1]  width scale
		//controlData[2]  height scale
		//controlData[3]  depth scale
		//controlData[4]  vertex rotation scaler
		//controlData[5]  line width scale
		//controlData[6]  pulse speed scale
		
		if(this.setUpStatus==0){return;}
		
		var objectIndex=0, partIndex=0, vertIndex=0;
		var XZPointPos = [0,0];
		var vertecies, tempCurve, vertArray;
		var yStart = 0;
		var vertexRotationIncrement=0, localPulseScale=0;
		
		for(objectIndex=0; objectIndex<this.objectTape.length; objectIndex++)
		{
			vertecies = new Array();
			for(vertIndex=0; vertIndex<this.lineSegments; vertIndex++)
			{
				yStart = (this.lineLength/this.lineSegments)*vertIndex;
				//root line point
				if(vertIndex==0)
				{
					vertecies.push( new THREE.Vector3(0, 0, 0) );
				}
				else
				{
					vertexRotationIncrement = this.objectTape[objectIndex].extrude[vertIndex][1]*controlData[4];
					this.objectTape[objectIndex].extrude[vertIndex][0] =  (this.objectTape[objectIndex].extrude[vertIndex][0]+vertexRotationIncrement)%360;
					XZPointPos = this.pixelMap.getElipticalPointsRaw(0, 0, this.lineLength, this.lineLength, this.objectTape[objectIndex].extrude[vertIndex][0]);
					vertecies.push( new THREE.Vector3(XZPointPos[1], yStart, XZPointPos[0]) );
				}	
			}
			tempCurve = new THREE.CatmullRomCurve3( vertecies );
			vertecies = tempCurve.getPoints( this.pollyFitness );
			vertArray = new Array();
			for(vertIndex=0; vertIndex<vertecies.length; vertIndex++)
			{
				vertArray.push(vertecies[vertIndex].x, vertecies[vertIndex].y, vertecies[vertIndex].z)
			}
			//Geometries
			this.objectTape[objectIndex].geometry[partIndex].setPositions( vertArray );
			//line width
			this.objectTape[objectIndex].materials[partIndex].linewidth = controlData[5];
			//sphere relocation
			this.objectTape[objectIndex].objects[partIndex+1].position.set(vertecies[vertecies.length-1].x, vertecies[vertecies.length-1].y, vertecies[vertecies.length-1].z);
			//pulse relocation
			this.objectTape[objectIndex].position[0] = (Math.round(this.objectTape[objectIndex].position[0]+controlData[6]))%vertecies.length;
			this.objectTape[objectIndex].objects[partIndex+2].position.set(vertecies[this.objectTape[objectIndex].position[0]].x, vertecies[this.objectTape[objectIndex].position[0]].y, vertecies[this.objectTape[objectIndex].position[0]].z);
			localPulseScale = this.objectTape[objectIndex].position[0]/vertecies.length;
			this.objectTape[objectIndex].objects[partIndex+2].scale.set(localPulseScale, localPulseScale, localPulseScale);
			
			//Line colour
			this.colourObject.getColour( this.subColourIndex%this.colourObject._bandWidth );
			this.objectTape[objectIndex].materials[partIndex].color.r = this.colourObject._currentColour[0]/255;
			this.objectTape[objectIndex].materials[partIndex].color.g = this.colourObject._currentColour[1]/255;
			this.objectTape[objectIndex].materials[partIndex].color.b = this.colourObject._currentColour[2]/255;
			//sphere Colour
			this.objectTape[objectIndex].materials[partIndex+1].color.r = this.colourObject._currentColour[0]/255;
			this.objectTape[objectIndex].materials[partIndex+1].color.g = this.colourObject._currentColour[1]/255;
			this.objectTape[objectIndex].materials[partIndex+1].color.b = this.colourObject._currentColour[2]/255;
			
			this.subColourIndex+=colourControls[1];	
		}
		
		//global Scale
		this.globalObjectGroup.scale.set(controlData[0]*controlData[1], controlData[0]*controlData[2], controlData[0]*controlData[3]);
		//global rotation
		this.globalObjectGroup.rotateX( this.angleToRadian(rotationalIncrements[0]) );
		this.globalObjectGroup.rotateY( this.angleToRadian(rotationalIncrements[1]) );
		this.globalObjectGroup.rotateZ( this.angleToRadian(rotationalIncrements[2]) );	

		this.colourIndex += colourControls[0];
		this.subColourIndex = this.colourIndex;
	}
	
	moveTo = function(currentLocation, nextLocation, motionSpeed)
	{
		var nextPoint = [0,0,0];
		var localMotion = [0,0,0];
		var localMotionRatio = [0,0,0];
		var pointCounter=0;
		
		//work out motion direction iether 1, -1 or 0 for no motion in that plane
		for(pointCounter=0; pointCounter<3; pointCounter++)
		{
			if(nextLocation[pointCounter]>currentLocation[pointCounter])
			{
				localMotion[pointCounter]=1;
			}
			else if(nextLocation[pointCounter]<currentLocation[pointCounter])
			{
				localMotion[pointCounter]=-1;
			}
			else
			{
				localMotion[pointCounter]=0;
			}
		}
		//work out the linear smoothed motion ratio based on distance remaining
		for(pointCounter=0; pointCounter<3; pointCounter++)
		{
			if(localMotion[pointCounter]==1)
			{
				localMotionRatio[pointCounter] = nextLocation[pointCounter]-currentLocation[pointCounter];
			}
			else if(localMotion[pointCounter]==-1)
			{
				localMotionRatio[pointCounter] = currentLocation[pointCounter]-nextLocation[pointCounter];
			}
			else
			{
				localMotionRatio[pointCounter]=0;
			}
			localMotionRatio[pointCounter] = (motionSpeed/localMotionRatio[pointCounter])*localMotionRatio[pointCounter];
		}
		/*
		//move each point to he next Location
		for(pointCounter=0; pointCounter<3; pointCounter++)
		{
			if(localMotion[pointCounter]==1 && currentLocation[pointCounter]+(localMotionRatio[pointCounter]*localMotion[pointCounter])<nextLocation[pointCounter] )
			{
				nextPoint[pointCounter] = localMotionRatio[pointCounter]*motionSpeed;
			}
			else if(localMotion[pointCounter]==-1 && currentLocation[pointCounter]+(localMotionRatio[pointCounter]*localMotion[pointCounter])>nextLocation[pointCounter] )
			{
				nextPoint[pointCounter] = localMotionRatio[pointCounter]*motionSpeed;
			}
			else if(localMotion[pointCounter]==1 && currentLocation[pointCounter]+(localMotionRatio[pointCounter]*localMotion[pointCounter])>=nextLocation[pointCounter] )
			{
				nextPoint[pointCounter] = nextLocation[pointCounter];
			}
			else
			{
				nextPoint[pointCounter] = nextLocation[pointCounter];
			}
		}
		*/
		
		//move each point to he next Location
		for(pointCounter=0; pointCounter<3; pointCounter++)
		{
			if(localMotion[pointCounter]==1 && currentLocation[pointCounter]+(localMotion[pointCounter]*motionSpeed)<nextLocation[pointCounter] )
			{
				nextPoint[pointCounter] = currentLocation[pointCounter]+(localMotion[pointCounter]*motionSpeed);
			}
			else if(localMotion[pointCounter]==-1 && currentLocation[pointCounter]+(localMotion[pointCounter]*motionSpeed)>nextLocation[pointCounter] )
			{
				nextPoint[pointCounter] = currentLocation[pointCounter]+(localMotion[pointCounter]*motionSpeed);
			}
			else if(localMotion[pointCounter]==1 && currentLocation[pointCounter]+(localMotion[pointCounter]*motionSpeed)>=nextLocation[pointCounter] )
			{
				nextPoint[pointCounter] = nextLocation[pointCounter];
			}
			else
			{
				nextPoint[pointCounter] = nextLocation[pointCounter];
			}
		}
		
		return nextPoint;
	}
	genRandomPoint = function()
	{
		var nextPoint = [0,0,0];
		
		nextPoint[0] = -this.screenRange[0]+(Math.random()*(this.screenRange[0]*2));
		nextPoint[1] = this.screenRange[1]-(Math.random()*(this.screenRange[1]*2));
		nextPoint[2] = -this.screenRange[2]+(Math.random()*(this.screenRange[2]*2));
		
		return nextPoint;
	}
	insertObject = function()
	{
		var objectIndex=0, partIndex=0, vertIndex=0;
		var vertecies, tempCurve, vertArray;
		var XYpointPos = [0,0], XZPointPos = [0,0];
		var localGroup = new THREE.Object3D();
		var yStart = 0;
		
		this.subColourIndex = this.colourIndex;
		for(objectIndex=0; objectIndex<this.lines; objectIndex++)
		{
			partIndex=0;
			this.objectTape.push( new animationObject() );
			this.objectTape[objectIndex].objectID = this.groupName+this.objectIDIndex;
			//vertex generator for curve
			vertecies = new Array();
			for(vertIndex=0; vertIndex<this.lineSegments; vertIndex++)
			{
				yStart = (this.lineLength/this.lineSegments)*vertIndex;
				//root line point
				if(vertIndex==0)
				{
					vertecies.push( new THREE.Vector3(0, 0, 0) );
					this.objectTape[objectIndex].extrude.push([0,0]);
				}
				else
				{
					XZPointPos = this.pixelMap.getElipticalPointsRaw(0, 0, this.lineLength, this.lineLength, (360/this.lineSegments)*vertIndex);
					vertecies.push( new THREE.Vector3(XZPointPos[0], yStart, XZPointPos[1]) );
					this.generatedirectionalVectors();
					this.objectTape[objectIndex].extrude.push([(360/this.lineSegments)*vertIndex,this.directionalVectors[0]]);
				}	
			}
			tempCurve = new THREE.CatmullRomCurve3( vertecies );
			vertecies = tempCurve.getPoints( this.pollyFitness );
			vertArray = new Array();
			for(vertIndex=0; vertIndex<vertecies.length; vertIndex++)
			{
				vertArray.push(vertecies[vertIndex].x, vertecies[vertIndex].y, vertecies[vertIndex].z)
			}
			//Geometries
			this.objectTape[objectIndex].geometry.push(  new LineGeometry() );
			this.objectTape[objectIndex].geometry[partIndex].setPositions( vertArray );
			//Material
			this.objectTape[objectIndex].materials.push( new LineMaterial( {color: 0xffffff, linewidth: 2, worldUnits: true, vertexColors: false, alphaToCoverage: false} ) );
			this.objectTape[objectIndex].materials[partIndex].transparent = true;
			this.objectTape[objectIndex].materials[partIndex].opacity = this.opacity;
			//colour
			this.colourObject.getColour( this.subColourIndex%this.colourObject._bandWidth );
			this.objectTape[objectIndex].materials[partIndex].color.r = this.colourObject._currentColour[0]/255;
			this.objectTape[objectIndex].materials[partIndex].color.g = this.colourObject._currentColour[1]/255;
			this.objectTape[objectIndex].materials[partIndex].color.b = this.colourObject._currentColour[2]/255;
			//Object
			this.objectTape[objectIndex].objects.push( new Line2(this.objectTape[objectIndex].geometry[partIndex], this.objectTape[objectIndex].materials[partIndex]) );
			//rotateLine on the Z axis
			//this.objectTape[objectIndex].objects[partIndex].rotateZ( this.angleToRadian((360/this.lines)*objectIndex) );
			if(this.bloomEnable==1)
			{
				if(this.bloomSegments[partIndex]==1)
				{
					this.objectTape[objectIndex].objects[partIndex].layers.enable( 1 );
				}
			}
			//add to local group
			localGroup.add( this.objectTape[objectIndex].objects[partIndex] );
			
			//Add end point sphere
			//------------------------------------
			partIndex++;
			this.objectTape[objectIndex].geometry.push( new THREE.SphereGeometry( this.pointSize, 32, 32 ) );
			this.objectTape[objectIndex].materials.push( new THREE.MeshLambertMaterial( {color: 0xffffff} ) );
			this.objectTape[objectIndex].materials[partIndex].transparent = true;
			this.objectTape[objectIndex].materials[partIndex].opacity = this.opacity;
			//colour
			this.colourObject.getColour( this.subColourIndex%this.colourObject._bandWidth );
			this.objectTape[objectIndex].materials[partIndex].color.r = this.colourObject._currentColour[0]/255;
			this.objectTape[objectIndex].materials[partIndex].color.g = this.colourObject._currentColour[1]/255;
			this.objectTape[objectIndex].materials[partIndex].color.b = this.colourObject._currentColour[2]/255;
			this.objectTape[objectIndex].objects.push( new THREE.Mesh(this.objectTape[objectIndex].geometry[partIndex], this.objectTape[objectIndex].materials[partIndex]) );
			//bloom
			if(this.bloomEnable==1)
			{
				if(this.bloomSegments[partIndex]==1)
				{
					this.objectTape[objectIndex].objects[partIndex].layers.enable( 1 );
				}
			}
			//sphere location
			//this.objectTape[objectIndex].objects[partIndex].rotateZ( this.angleToRadian((360/this.lines)*objectIndex) );
			this.objectTape[objectIndex].objects[partIndex].position.set(vertecies[vertecies.length-1].x, vertecies[vertecies.length-1].y, vertecies[vertecies.length-1].z);
			//add to local group
			localGroup.add( this.objectTape[objectIndex].objects[partIndex] );
		
			//Add pulse sphere
			//------------------------------------
			partIndex++;
			this.objectTape[objectIndex].geometry.push( new THREE.SphereGeometry( this.pointSize, 32, 32 ) );
			this.objectTape[objectIndex].materials.push( new THREE.MeshLambertMaterial( {color: 0xffffff} ) );
			this.objectTape[objectIndex].materials[partIndex].transparent = true;
			this.objectTape[objectIndex].materials[partIndex].opacity = this.opacity;
			//colour
			this.colourObject.getColour( this.subColourIndex%this.colourObject._bandWidth );
			this.objectTape[objectIndex].materials[partIndex].color.r = this.colourObject._currentColour[0]/255;
			this.objectTape[objectIndex].materials[partIndex].color.g = this.colourObject._currentColour[1]/255;
			this.objectTape[objectIndex].materials[partIndex].color.b = this.colourObject._currentColour[2]/255;
			this.objectTape[objectIndex].objects.push( new THREE.Mesh(this.objectTape[objectIndex].geometry[partIndex], this.objectTape[objectIndex].materials[partIndex]) );
			//scale to 0
			this.objectTape[objectIndex].objects[partIndex].scale.set(0,0,0);
			//bloom
			if(this.bloomEnable==1)
			{
				if(this.bloomSegments[partIndex]==1)
				{
					this.objectTape[objectIndex].objects[partIndex].layers.enable( 1 );
				}
			}
			this.objectTape[objectIndex].position[0] = Math.round(Math.random()*vertecies.length);	//tracks pulse along line
			//something here breaks sometimes????????????????
			this.objectTape[objectIndex].objects[partIndex].position.set(vertecies[this.objectTape[objectIndex].position[0]].x, vertecies[this.objectTape[objectIndex].position[0]].y, vertecies[this.objectTape[objectIndex].position[0]].z);
			//add to local group
			localGroup.add( this.objectTape[objectIndex].objects[partIndex] );
			
			this.objectIDIndex++;
			this.subColourIndex += this.creationColourIncrement;
		}
		//reset colour index
		this.subColourIndex = this.colourIndex;
		
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
export default threeCurveLines;