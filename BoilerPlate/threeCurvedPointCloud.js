import * as THREE from 'three';
import envelopGenerator from './envelopGenerator.js';					//Envelop Generator
import CCGenerator from './CCGenerator.js';								//Colour System
import timerObject from './timerObject.js';								//Timers
import pixelMaper from './pixelMaper.js';								//Pixel Maper
import animationObject from './animationObject.js';						//Generic Object Tracking class
import ElipticalEnvelopGenerator from './ElipticalEnvelopGenerator.js';
import curvePoint from './threeCurvePoint.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';
import { LineSegments2 } from 'three/addons/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/addons/lines/LineSegmentsGeometry.js';
import { Line2 } from 'three/addons/lines/Line2.js';
import { LineGeometry } from 'three/addons/lines/LineGeometry.js';

class threeCurvedPointCloud
{	
	constructor()
	{
		//Main object stores
		this.objectTape = new Array();
		this.globalGroupArray = new Array();
		this.globalObjectGroup = new THREE.Object3D();
		this.groupName = "CPL_";
		this.objectIDIndex = 0;
		this.genObject = new animationObject();
		
		//Global Three Objects form main System
		this.scene;
		
		//Main properties
		this.origin = [0,0,0];
		this.dimensions = [300, 50, 300];
		this.zRange = 400;
		this.pointsPerCloud = 100;
		this.pollyStartAngle = 0;
		this.blockCount = 4;
		this.lfoSeed = 0;
		this.bloomEnable = 0;
		this.bloomOn = 3;
		this.defaultOpacity = 1;
		this.defaultLineWidth = 1;
		this.pollyFiness = 256;
		this.motionSpeed = 1;
		this.rotations = [0,0,0];
		this.multiObject = 0;
		this.setUpStatus = 0;
		
		//Utility Objects
		this.pixelMap = new pixelMaper(2,2);
		this.screenRange = [500,300,200];
		this.timers = new timerObject();
		this.envelops = new envelopGenerator();
		this.lfo = new ElipticalEnvelopGenerator();
		this.directionalVectors = [1,1,1];
		this.rotateTo = [0,0,0];
		this.rotationalSpeed = [1,1,1];
		this.sprite = new THREE.TextureLoader().load( './BoilerPlate/disc.png' );
		
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
		//this.lfo.addWithTimeCode("opacityLFO", [ 100 ], [100], 0, 0);
		this.subColourIndex = this.colourIndex;
		this.sprite.colorSpace = THREE.SRGBColorSpace;

	}
	animate = function(colourControls, controlData, rotationalIncrements=[0,0,0])
	{
		//controlData[0]  object scale
		//controlData[1]  width scale
		//controlData[2]  height scale
		//controlData[3]  depth scale
		//controlData[4]  point scale
		//controlData[5]  point speed
		
		if(this.setUpStatus==0){return;}
		var objectIndex=0, partIndex=0, vertIndex=0, vertArray, tempVector, tempMotionSpeed=0;
		
		tempMotionSpeed = this.motionSpeed*controlData[5];
		vertArray = new Array();
		for(vertIndex=0; vertIndex<this.objectTape[objectIndex].pointData[partIndex].length; vertIndex++)
		{
			if(tempMotionSpeed>0 || this.objectTape[objectIndex].pointData[partIndex][vertIndex][0]+tempMotionSpeed>0)
			{
				this.objectTape[objectIndex].pointData[partIndex][vertIndex][0] = (this.objectTape[objectIndex].pointData[partIndex][vertIndex][0]+tempMotionSpeed)%this.objectTape[objectIndex].pointData[partIndex].length;
			}
			else
			{
				this.objectTape[objectIndex].pointData[partIndex][vertIndex][0] = this.objectTape[objectIndex].pointData[partIndex].length;
			}
			tempVector = this.objectTape[objectIndex].shape[partIndex].getPointAt( (this.objectTape[objectIndex].pointData[partIndex][vertIndex][0]/this.pointsPerCloud) );
			vertArray.push(tempVector.x, tempVector.y, this.objectTape[objectIndex].pointData[partIndex][vertIndex][1]);
		}
		this.objectTape[objectIndex].geometry[partIndex].dispose();
		this.objectTape[objectIndex].geometry[partIndex].setAttribute( 'position', new THREE.Float32BufferAttribute( vertArray , 3 ) );

		
		//colour
		this.setMaterialColour(this.objectTape[objectIndex].materials[partIndex], this.colourIndex);
		this.objectTape[objectIndex].materials[partIndex].size = controlData[4];
		
		//global rotation		
		this.globalObjectGroup.rotateX( this.angleToRadian(this.rotationalSpeed[0]*rotationalIncrements[0]) );
		this.globalObjectGroup.rotateY( this.angleToRadian(this.rotationalSpeed[1]*rotationalIncrements[1]) );
		this.globalObjectGroup.rotateZ( this.angleToRadian(this.rotationalSpeed[2]*rotationalIncrements[2]) );
		//scale
		this.globalObjectGroup.scale.set(controlData[0]*controlData[1], controlData[0]*controlData[2], controlData[0]*controlData[3]); 

		this.colourIndex += colourControls[0];
		this.subColourIndex = this.colourIndex;
	}
	insertObject = function()
	{
		var objectIndex=0, partIndex=0, vertIndex=0, tempZ=0, blockCounter=0;
		var angularGap = 5;
		var angularConstrictor = [angularGap, 180-angularGap];
		var vertecies, fullVertArray, vertArray, pointPos, tempVector;		
		var localGroup = new THREE.Object3D();
		var rotaionAxis = new THREE.Vector3(0, 0, 1).normalize(); 
		
		localGroup = new THREE.Object3D();
		this.objectTape.push( new animationObject() );
		this.objectTape[objectIndex].objectID = this.groupName+this.objectIDIndex;

		//create polly line
		vertecies = new Array();
		fullVertArray = new Array();
		for(vertIndex=angularConstrictor[0]; vertIndex<angularConstrictor[1]; vertIndex++)
		{
			pointPos = this.pixelMap.getElipticalPointsRaw(0, 0, this.dimensions[0], this.dimensions[1], vertIndex);
			vertecies.push( new THREE.Vector3(pointPos[0], pointPos[1], 0) );
			fullVertArray.push( new THREE.Vector3(pointPos[0], pointPos[1], 0) );
		}
		for(blockCounter=0; blockCounter<this.blockCount-1; blockCounter++)
		{
			for(vertIndex=0; vertIndex<vertecies.length; vertIndex++)
			{
				rotaionAxis = new THREE.Vector3(0, 0, 1).normalize();
				vertecies[vertIndex].applyAxisAngle(rotaionAxis, this.angleToRadian(360/this.blockCount));
				fullVertArray.push( new THREE.Vector3(vertecies[vertIndex].x, vertecies[vertIndex].y, vertecies[vertIndex].z ));
			}
			
		}
		
		this.objectTape[objectIndex].shape.push( new THREE.CatmullRomCurve3( fullVertArray ) );
		//create point cloud
		vertArray = new Array();
		vertecies = new Array();
		for(vertIndex=0; vertIndex<this.pointsPerCloud; vertIndex++)
		{
			tempZ = -(this.dimensions[2]/2)+(Math.random()*this.dimensions[2]);
			vertecies.push([vertIndex, tempZ]);
			tempVector = this.objectTape[objectIndex].shape[partIndex].getPointAt( (vertIndex/this.pointsPerCloud) );
			vertArray.push(tempVector.x, tempVector.y, tempZ);
		}
		this.objectTape[objectIndex].pointData.push(vertecies);
		//Geometries
		this.objectTape[objectIndex].geometry.push( new THREE.BufferGeometry() );
		this.objectTape[objectIndex].geometry[partIndex].setAttribute( 'position', new THREE.Float32BufferAttribute( vertArray , 3 ) );
		this.objectTape[objectIndex].materials.push( new THREE.PointsMaterial( { color: 0xffffff, size: 1, map: this.sprite, transparent: true} ) );
		//colour
		this.setMaterialColour(this.objectTape[objectIndex].materials[partIndex], this.subColourIndex);
		this.objectTape[objectIndex].objects.push( new THREE.Points(this.objectTape[objectIndex].geometry[partIndex], this.objectTape[objectIndex].materials[partIndex]) );
		//bloom
		if(this.bloomEnable==1)
		{
			this.objectTape[objectIndex].objects[partIndex].layers.enable( 1 );
		}
		//add to local group
		localGroup.add( this.objectTape[objectIndex].objects[partIndex] );		
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
	setMaterialColour = function(materialObject, colourIndex)
	{
		this.colourObject.getColour( colourIndex%this.colourObject._bandWidth );
		materialObject.color.r = this.colourObject._currentColour[0]/255;
		materialObject.color.g = this.colourObject._currentColour[1]/255;
		materialObject.color.b = this.colourObject._currentColour[2]/255;
	}
}
export default threeCurvedPointCloud;