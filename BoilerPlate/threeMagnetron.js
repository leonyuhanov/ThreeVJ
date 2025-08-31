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

class threeMagnetron
{	
	constructor()
	{
		//Main object stores
		this.objectTape = new Array();
		this.globalGroupArray = new Array();
		this.globalObjectGroup = new THREE.Object3D();
		this.groupName = "MAGT_";
		this.objectIDIndex = 0;
		this.genObject = new animationObject();
		
		//Global Three Objects form main System
		this.scene;
		
		//Main properties
		this.origin = [0,0,0];
		this.orbitslRingPointIncrement = 1;
		this.orbitalRingDimensions = [200, 200, 5];
		this.orbitalRingParts = 4;
		this.energyRingDimensions = [20, 20, 10];
		this.energyRingCount = 4;
		this.pointePerEnergyRing = 10;
		this.defaultParticleSize = 5;
		this.orbitalRingPointCount = 100;
		this.orbitalRingPointDepth = 10;
		this.energyRingStart = 0;
		this.orbitalPartSpacer = 5;
		this.lfoSeed = 0;
		this.orbitalRingBloom = 0;
		this.energyRingBloom = 1;
		this.orbitalLineSpeed = 1;
		this.energyRingRotatationSpeed = 1;
		this.pollyFiness = 720;
		this.energyLinePollyFitness = 360;
		this.pathLineFiness = 4;
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
		this.subColourIndex = this.colourIndex;
		this.sprite.colorSpace = THREE.SRGBColorSpace;
		//this.lfo.addWithTimeCode("opacityLFO", [ 100 ], [100], 0, 0);
	}
	animate = function(colourControls, controlData, rotationalIncrements=[0,0,0])
	{
		//controlData[0]  object scale
		//controlData[1]  width scale
		//controlData[2]  height scale
		//controlData[3]  depth scale
		//controlData[4]  Orbital Line width scaler
		//controlData[5]  Orbital Line speed scaler
		//controlData[6]  Energy Ring Point size scaler
		//controlData[7]  Energy Ring Speed Scaler
		//controlData[8]  Energy Ring rotation speed Scaler
		//controlData[9]  orbital particle size
		//controlData[10]  orbital particle speed
		
		if(this.setUpStatus==0){return;}
		var objectIndex=1, partIndex=0, vertIndex=0, pointSpeed=0, pointIndex=0;
		var degsPerOrbitalPart = (this.pollyFiness/this.orbitalRingParts) - this.orbitalPartSpacer;
		var degIndex=0;
		var vertArray, pointPos;
		
		//orbital ring motion
		for(partIndex=0; partIndex<this.orbitalRingParts; partIndex++)
		{
			vertArray = new Array();
			//increment line start position
			this.objectTape[objectIndex].pointData[partIndex] += this.orbitalLineSpeed*controlData[5];
			for(vertIndex=this.objectTape[objectIndex].pointData[partIndex]; vertIndex<this.objectTape[objectIndex].pointData[partIndex]+degsPerOrbitalPart; vertIndex++)
			{
				pointPos = this.objectTape[0].shape[0].getPointAt((vertIndex/this.pollyFiness)%1);
				vertArray.push(pointPos.x, pointPos.y, pointPos.z);
			}
			this.objectTape[objectIndex].geometry[partIndex].dispose();
			this.objectTape[objectIndex].geometry[partIndex].setPositions( vertArray );
			//line width
			this.objectTape[objectIndex].materials[partIndex].linewidth = this.orbitalRingDimensions[2]*controlData[4];
			//colour
			this.setMaterialColour(this.objectTape[objectIndex].materials[partIndex], this.subColourIndex);
			this.subColourIndex += colourControls[1];
		}
		//energy ring particle motion
		objectIndex=3;
		for(partIndex=0; partIndex<this.energyRingCount; partIndex++)
		{
			vertArray = new Array();
			for(vertIndex=0; vertIndex<this.pointePerEnergyRing; vertIndex++)
			{
				pointSpeed = this.objectTape[objectIndex].pointData[partIndex][vertIndex][1]*controlData[7];
				this.objectTape[objectIndex].pointData[partIndex][vertIndex][0] += pointSpeed;
				pointIndex = this.objectTape[objectIndex].pointData[partIndex][vertIndex][0]/this.energyLinePollyFitness;
				pointPos = this.objectTape[objectIndex].shape[partIndex][vertIndex].getPointAt(pointIndex%1);
				vertArray.push(pointPos.x, pointPos.y, pointPos.z);
			}
			this.objectTape[objectIndex].geometry[partIndex].dispose();
			this.objectTape[objectIndex].geometry[partIndex].setAttribute( 'position', new THREE.Float32BufferAttribute( vertArray , 3 ) );
			//point size
			this.objectTape[objectIndex].materials[partIndex].size = this.defaultParticleSize*controlData[6];
			//colour
			this.setMaterialColour(this.objectTape[objectIndex].materials[partIndex], this.subColourIndex);
			this.subColourIndex += colourControls[1];
			//energy ring rotational motion index at this.objectTape[objectIndex].extrude
			this.objectTape[objectIndex].extrude[partIndex] += this.energyRingRotatationSpeed*controlData[8];
			pointPos = this.objectTape[0].shape[0].getPointAt( (this.objectTape[objectIndex].extrude[partIndex]/this.pollyFiness)%1 );
			this.objectTape[objectIndex].objects[partIndex].position.set(pointPos.x, pointPos.y, pointPos.z);
			//rottaion based on position
			this.objectTape[objectIndex].objects[partIndex].setRotationFromEuler( new THREE.Euler( 0, 0, 0, 'XYZ' ));
			this.objectTape[objectIndex].objects[partIndex].rotateZ( this.angleToRadian( (360*((this.objectTape[objectIndex].extrude[partIndex]/this.pollyFiness)%1))%180 ) );
			this.objectTape[objectIndex].objects[partIndex].rotateY( this.angleToRadian(90) );
		}
		objectIndex=4;
		partIndex=0;
		vertArray = new Array();
		for(vertIndex=0; vertIndex<this.orbitalRingPointCount; vertIndex++)
		{
			this.objectTape[objectIndex].pointData[vertIndex][0] += this.objectTape[objectIndex].pointData[vertIndex][2]*controlData[10];
			pointPos = this.objectTape[0].shape[0].getPointAt((this.objectTape[objectIndex].pointData[vertIndex][0]/this.pollyFiness)%1);
			vertArray.push(pointPos.x, pointPos.y, this.objectTape[objectIndex].pointData[vertIndex][1]);
		}
		this.objectTape[objectIndex].geometry[partIndex].dispose();
		this.objectTape[objectIndex].geometry[partIndex].setAttribute( 'position', new THREE.Float32BufferAttribute( vertArray , 3 ) );
		//colour
		this.setMaterialColour(this.objectTape[objectIndex].materials[partIndex], this.subColourIndex);
		//point size
		this.objectTape[objectIndex].materials[partIndex].size = this.defaultParticleSize*controlData[9];
			
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
		var objectIndex=0, partIndex=0, vertIndex=0, pathLinePointIndex=0, pointStartIndex=0, energyRingPosition=0, orbitalRingPointsPosition=0, tempZ=0;
		var degsPerOrbitalPart = (this.pollyFiness/this.orbitalRingParts) - this.orbitalPartSpacer;
		var degIndex=0;
		var vertecies, vertArray, pointPos, tempPathPoints, tempDataPoints;		
		var localGroup = new THREE.Object3D();
		
		localGroup = new THREE.Object3D();
		
		//create the primary orbital ring guide
		this.objectTape.push( new animationObject() );
		this.objectTape[objectIndex].objectID = this.groupName+this.objectIDIndex;
		vertecies = new Array();
		for(vertIndex=0; vertIndex<360; vertIndex+=this.orbitslRingPointIncrement)
		{
			pointPos = this.pixelMap.getElipticalPointsRaw(0, 0, this.orbitalRingDimensions[0], this.orbitalRingDimensions[1], vertIndex);
			vertecies.push( new THREE.Vector3(pointPos[0], pointPos[1], 0) );
			vertecies.push( new THREE.Vector3(pointPos[0], pointPos[1], 0) );
		}
		vertecies.push(vertecies[0]);
		this.objectTape[objectIndex].shape.push( new THREE.CatmullRomCurve3( vertecies ) );
		
		objectIndex++;
		
		//create the primary orbital ring parts from the above guide Line
		this.objectTape.push( new animationObject() );
		this.objectTape[objectIndex].objectID = this.groupName+this.objectIDIndex;
		for(partIndex=0; partIndex<this.orbitalRingParts; partIndex++)
		{
			vertecies = new Array();
			vertArray = new Array();
			degIndex = (this.orbitalPartSpacer+degsPerOrbitalPart)*partIndex
			this.objectTape[objectIndex].pointData.push(degIndex);
			for(vertIndex=degIndex; vertIndex<degIndex+degsPerOrbitalPart; vertIndex++)
			{
				pointPos = this.objectTape[0].shape[0].getPointAt((vertIndex/this.pollyFiness)%1);
				vertArray.push(pointPos.x, pointPos.y, pointPos.z);
			}
			//this.objectTape[objectIndex].shape.push( new THREE.CatmullRomCurve3( vertecies ) );
			//setFromPoints 
			//Geometries
			this.objectTape[objectIndex].geometry.push(  new LineGeometry() );
			this.objectTape[objectIndex].geometry[partIndex].setPositions( vertArray );
			//Material
			this.objectTape[objectIndex].materials.push( new LineMaterial( {color: 0xffffff, linewidth: this.orbitalRingDimensions[2], worldUnits: true, vertexColors: false, alphaToCoverage: false} ) );
			this.objectTape[objectIndex].materials[partIndex].transparent = true;
			//colour
			this.setMaterialColour(this.objectTape[objectIndex].materials[partIndex], this.subColourIndex);
			this.objectTape[objectIndex].objects.push( new Line2(this.objectTape[objectIndex].geometry[partIndex], this.objectTape[objectIndex].materials[partIndex]) );
			if(this.orbitalRingBloom==1)
			{
				this.objectTape[objectIndex].objects[partIndex].layers.enable( 1 );
			}
			//add to local group
			localGroup.add( this.objectTape[objectIndex].objects[partIndex] );
		}
		objectIndex++;
		
		//create the primary energy line circle for all paths of all energy circles
		this.objectTape.push( new animationObject() );
		this.objectTape[objectIndex].objectID = this.groupName+this.objectIDIndex;
		vertecies = new Array();
		for(vertIndex=0; vertIndex<360; vertIndex++)
		{
			pointPos = this.pixelMap.getElipticalPointsRaw(0, 0, this.energyRingDimensions[0], this.energyRingDimensions[1], vertIndex);
			vertecies.push( new THREE.Vector3(pointPos[0], pointPos[1], 0) );
		}
		vertecies.push(vertecies[0]);
		this.objectTape[objectIndex].shape.push( new THREE.CatmullRomCurve3( vertecies ) );
		objectIndex++;		
		
		//create all the energy rings based on the above path
		this.objectTape.push( new animationObject() );
		this.objectTape[objectIndex].objectID = this.groupName+this.objectIDIndex;
		for(partIndex=0; partIndex<this.energyRingCount; partIndex++)
		{
			//create a pathline for all points
			tempPathPoints = new Array();
			for(vertIndex=0; vertIndex<this.pointePerEnergyRing; vertIndex++)
			{
				vertecies = new Array();
				for(pathLinePointIndex=0; pathLinePointIndex<360; pathLinePointIndex+=this.pathLineFiness)
				{
					pointPos = this.objectTape[2].shape[0].getPointAt((1/360)*pathLinePointIndex)
					this.generatedirectionalVectors();
					vertecies.push(  new THREE.Vector3(pointPos.x, pointPos.y, (Math.random()*(this.energyRingDimensions[2]/2))*this.directionalVectors[0]) );
				}
				vertecies.push(vertecies[0]);
				tempPathPoints.push(new THREE.CatmullRomCurve3( vertecies ))
			}
			//---------------------------------------
			tempDataPoints = new Array();
			vertArray = new Array();
			for(vertIndex=0; vertIndex<this.pointePerEnergyRing; vertIndex++)
			{
				//Generate a point from the above path
				pointStartIndex = Math.random()*this.energyLinePollyFitness;
				pointPos = tempPathPoints[vertIndex].getPointAt(pointStartIndex/this.energyLinePollyFitness);
				tempDataPoints.push([pointStartIndex,(Math.random()*1)+0.5]);	//point location, point speed
				vertArray.push(pointPos.x, pointPos.y, pointPos.z);
			}
			//Store all the path lines for each point in the shape Array
			this.objectTape[objectIndex].shape.push(tempPathPoints);
			//store point indexes in the pointData array
			this.objectTape[objectIndex].pointData.push(tempDataPoints);
			
			//Geometries
			this.objectTape[objectIndex].geometry.push( new THREE.BufferGeometry() );
			this.objectTape[objectIndex].geometry[partIndex].setAttribute( 'position', new THREE.Float32BufferAttribute( vertArray , 3 ) );
			this.objectTape[objectIndex].materials.push( new THREE.PointsMaterial( { color: 0xffffff, size: this.defaultParticleSize, map: this.sprite, alphaTest: 0.5, transparent: true} ) );
			//colour
			this.setMaterialColour(this.objectTape[objectIndex].materials[partIndex], this.subColourIndex);
			this.objectTape[objectIndex].objects.push( new THREE.Points(this.objectTape[objectIndex].geometry[partIndex], this.objectTape[objectIndex].materials[partIndex]) );
			//position on orbital ring stored in extrude array
			energyRingPosition = ((this.pollyFiness/this.energyRingCount)*partIndex);
			this.objectTape[objectIndex].extrude.push(energyRingPosition);
			pointPos = this.objectTape[0].shape[0].getPointAt(energyRingPosition/this.pollyFiness);//((this.pollyFiness/this.energyRingCount)/this.pollyFiness)*partIndex
			this.objectTape[objectIndex].objects[partIndex].position.set(pointPos.x, pointPos.y, pointPos.z);
			this.objectTape[objectIndex].objects[partIndex].rotateZ( this.angleToRadian( ((360/this.energyRingCount)*partIndex)%180 ) );
			this.objectTape[objectIndex].objects[partIndex].rotateY( this.angleToRadian(90) );
			//bloom
			if(this.energyRingBloom==1)
			{
				this.objectTape[objectIndex].objects[partIndex].layers.enable( 1 );
			}
			//add to local group
			localGroup.add( this.objectTape[objectIndex].objects[partIndex] );		
		}
		objectIndex++;	
		
		//create the orbital ring point cloud
		partIndex=0;
		this.objectTape.push( new animationObject() );
		this.objectTape[objectIndex].objectID = this.groupName+this.objectIDIndex;
		vertArray = new Array();
		for(vertIndex=0; vertIndex<this.orbitalRingPointCount; vertIndex++)
		{
			this.generatedirectionalVectors();
			orbitalRingPointsPosition = Math.random()*this.pollyFiness;
			pointPos = this.objectTape[0].shape[0].getPointAt((orbitalRingPointsPosition/this.pollyFiness)%1);
			tempZ = (Math.random()*this.orbitalRingPointDepth)*this.directionalVectors[0];
			vertArray.push(pointPos.x, pointPos.y, tempZ);
			this.objectTape[objectIndex].pointData.push([orbitalRingPointsPosition, tempZ, (Math.random()*2)+0.2]);

		}
		//Geometries
		this.objectTape[objectIndex].geometry.push( new THREE.BufferGeometry() );
		this.objectTape[objectIndex].geometry[partIndex].setAttribute( 'position', new THREE.Float32BufferAttribute( vertArray , 3 ) );
		this.objectTape[objectIndex].materials.push( new THREE.PointsMaterial( { color: 0xffffff, size: this.defaultParticleSize, map: this.sprite, transparent: true} ) );
		//colour
		this.setMaterialColour(this.objectTape[objectIndex].materials[partIndex], this.subColourIndex);
		this.objectTape[objectIndex].objects.push( new THREE.Points(this.objectTape[objectIndex].geometry[partIndex], this.objectTape[objectIndex].materials[partIndex]) );
		//bloom
		if(this.orbitalRingBloom==1)
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
export default threeMagnetron;