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

class threeTriggerCube
{	
	constructor()
	{
		//Main object stores
		this.objectTape = new Array();
		this.globalGroupArray = new Array();
		this.globalObjectGroup = new THREE.Object3D();
		this.groupName = "TC_";
		this.objectIDIndex = 0;
		this.genObject = new animationObject();
		
		//Global Three Objects form main System
		this.scene;
		
		//Main properties
		this.origin = [0,0,0];
		this.dimensions = [100,100,100];
		this.pollyRadius = 100;
		this.vertexCount = 4;
		this.defaultStartAngle = 45;
		this.lineOpacity = 1;
		this.lineWidth = 1.5;
		this.lfoSeed = 0;
		this.bloomEnable = 0;
		this.pollyFiness = 720;
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
		
		//Colour System
		this.colourIndex = 0;
		this.subColourIndex = 0;
		this.creationColourIncrement = 10;
		this.maxValue = 255;
		this.maxColourDitherSteps = 128;
		this.colourList_1 = [this.maxValue,0,0,this.maxValue,this.maxValue,0, 0,this.maxValue,0, 0,this.maxValue,this.maxValue, 0,0,this.maxValue, this.maxValue,0,this.maxValue, this.maxValue,this.maxValue,this.maxValue];
		this.colourObject = new CCGenerator(this.maxColourDitherSteps, this.colourList_1.length/3, this.colourList_1);
		this.defaultColour = 0xffffff;
	}
	init = function(scene, colourIndex)
	{
		this.scene = scene;
		this.colourIndex = colourIndex;
		this.subColourIndex = this.colourIndex;
		this.lfo.addWithTimeCode("pollyGrow", [100], [100], 2, this.lfoSeed);
		this.lfo.addWithTimeCode("pollyMotion", [100], [150], 2, this.lfoSeed);
		this.lfo.addWithTimeCode("pollyRotation", [100], [50], 2, this.lfoSeed);
	}
	animate = function(colourControls, controlData, rotationalIncrements=[0,0,0])
	{
		//controlData[0]  object scale
		//controlData[1]  width scale
		//controlData[2]  height scale
		//controlData[3]  depth scale
		//controlData[4]  burst Trigger
		//controlData[5]  burst speed
		//controlData[6]  line width scaler

		
		if(this.setUpStatus==0){return;}	
		var objectIndex=0, partIndex=0;
		var pointPos, vertIndex, vertecies = new Array();
		var lfoValue=0, tempRadius=0, tempDistanceScaler=0, tempRotationScaler=0;

		if(controlData[4]==1)
		{
			this.lfo.setOneShotState("pollyGrow", 1, 0);
			this.lfo.setOneShotState("pollyMotion", 1, 0);
			this.lfo.setOneShotState("pollyRotation", 1, 0);
		}
		
		if(this.lfo.getOneShotState("pollyGrow")==1)
		{
			if(this.lfo.isHalfWay("pollyGrow"))
			{
				this.lfo.setOneShotState("pollyGrow", 2, 0);
				this.lfo.setOneShotState("pollyMotion", 2, 0);
				this.lfo.setOneShotState("pollyRotation", 2, 0);
				tempRadius = 0;
				tempDistanceScaler = 0;
				tempRotationScaler = 0;
			}
			else
			{
				lfoValue = this.lfo.read("pollyGrow", controlData[5], 0)/100;
				tempRadius = this.pollyRadius*lfoValue;	
				tempDistanceScaler = this.lfo.read("pollyMotion", controlData[5], 0)/100;
				tempRotationScaler = 90*(this.lfo.read("pollyRotation", controlData[5], 0)/100);
			}
			this.objectTape[objectIndex].shape[partIndex] = new THREE.EllipseCurve(0, 0, tempRadius, tempRadius, 0,  2 * Math.PI, false, 0);
			for(vertIndex=0; vertIndex<this.pollyFiness; vertIndex+=(this.pollyFiness/this.vertexCount))
			{
				pointPos = this.objectTape[objectIndex].shape[partIndex].getPointAt( ((vertIndex/this.pollyFiness)+(this.defaultStartAngle/360))%1 );
				vertecies.push(pointPos.x, pointPos.y, 0);
			}
			vertecies.push(vertecies[0], vertecies[1], vertecies[2]);
			for(partIndex=0; partIndex<this.objectTape[objectIndex].geometry.length; partIndex++)
			{
				this.objectTape[objectIndex].geometry[partIndex].dispose();
				this.objectTape[objectIndex].geometry[partIndex].setPositions( vertecies );
				this.objectTape[objectIndex].materials[partIndex].linewidth = this.lineWidth*controlData[6]; 
			}
			//handle polly speeration individualy
			this.objectTape[objectIndex].objects[0].position.set(0,0,-this.dimensions[2]*tempDistanceScaler);
			this.objectTape[objectIndex].objects[1].position.set(0,0,this.dimensions[2]*tempDistanceScaler);
			this.objectTape[objectIndex].objects[2].position.set(-this.dimensions[2]*tempDistanceScaler,0,0);
			this.objectTape[objectIndex].objects[3].position.set(this.dimensions[2]*tempDistanceScaler,0,0);
			this.objectTape[objectIndex].objects[4].position.set(0,-this.dimensions[2]*tempDistanceScaler,0);
			this.objectTape[objectIndex].objects[5].position.set(0,this.dimensions[2]*tempDistanceScaler,0);
			//handle polly rottaion individualy
			this.objectTape[objectIndex].objects[0].setRotationFromEuler( new THREE.Euler( 0, 0, 0, 'XYZ' ));
			this.objectTape[objectIndex].objects[1].setRotationFromEuler( new THREE.Euler( 0, 0, 0, 'XYZ' ));
			this.objectTape[objectIndex].objects[0].rotateZ( this.angleToRadian(tempRotationScaler	) );
			this.objectTape[objectIndex].objects[1].rotateZ( this.angleToRadian(tempRotationScaler	) );
			this.objectTape[objectIndex].objects[2].setRotationFromEuler( new THREE.Euler( 0, this.angleToRadian(90), 0, 'XYZ' ));
			this.objectTape[objectIndex].objects[3].setRotationFromEuler( new THREE.Euler( 0, this.angleToRadian(90), 0, 'XYZ' ));
			this.objectTape[objectIndex].objects[2].rotateZ( this.angleToRadian(tempRotationScaler) );
			this.objectTape[objectIndex].objects[3].rotateZ( this.angleToRadian(tempRotationScaler) );
			this.objectTape[objectIndex].objects[4].setRotationFromEuler( new THREE.Euler( this.angleToRadian(90), 0, 0, 'XYZ' ));
			this.objectTape[objectIndex].objects[5].setRotationFromEuler( new THREE.Euler( this.angleToRadian(90), 0, 0, 'XYZ' ));
			this.objectTape[objectIndex].objects[4].rotateZ( this.angleToRadian(tempRotationScaler) );
			this.objectTape[objectIndex].objects[5].rotateZ( this.angleToRadian(tempRotationScaler) );
		}
		
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
		var objectIndex=0, partIndex=0;
		var pointPos, vertIndex, vertecies = new Array();
		var localGroup = new THREE.Object3D();
				
		this.objectTape.push( new animationObject() );
		this.objectTape[objectIndex].objectID = this.groupName+this.objectIDIndex;		
		
		//create the polly guide shape
		this.objectTape[objectIndex].shape.push( new THREE.EllipseCurve(0, 0, 0, 0, 0,  2 * Math.PI, false, 0) );
		for(vertIndex=0; vertIndex<this.pollyFiness; vertIndex+=(this.pollyFiness/this.vertexCount))
		{
			pointPos = this.objectTape[objectIndex].shape[partIndex].getPointAt( (vertIndex/this.pollyFiness)+(this.defaultStartAngle/360) );
			vertecies.push(pointPos.x, pointPos.y, 0);
		}
		vertecies.push(vertecies[0], vertecies[1], vertecies[2]);

		//front polly
		//Geometries
		this.objectTape[objectIndex].geometry.push( new LineGeometry() );
		this.objectTape[objectIndex].geometry[partIndex].setPositions( vertecies );
		this.objectTape[objectIndex].materials.push( new LineMaterial( {color: this.defaultColour, linewidth: this.lineWidth, worldUnits: true, vertexColors: false, alphaToCoverage: false, } ) );
		this.objectTape[objectIndex].materials[partIndex].transparent = true;
		this.objectTape[objectIndex].materials[partIndex].opacity = this.lineOpacity;
		//colour
		this.setMaterialColour(this.objectTape[objectIndex].materials[partIndex], this.subColourIndex);
		this.objectTape[objectIndex].objects.push( new Line2(this.objectTape[objectIndex].geometry[partIndex], this.objectTape[objectIndex].materials[partIndex]) );
		this.objectTape[objectIndex].objects[partIndex].position.set(0,0,-this.dimensions[2]);
		partIndex++;
		//back polly
		//Geometries
		this.objectTape[objectIndex].geometry.push( new LineGeometry() );
		this.objectTape[objectIndex].geometry[partIndex].setPositions( vertecies );
		this.objectTape[objectIndex].materials.push( new LineMaterial( {color: this.defaultColour, linewidth: this.lineWidth, worldUnits: true, vertexColors: false, alphaToCoverage: false} ) );
		this.objectTape[objectIndex].materials[partIndex].transparent = true;
		this.objectTape[objectIndex].materials[partIndex].opacity = this.lineOpacity;
		//colour
		this.setMaterialColour(this.objectTape[objectIndex].materials[partIndex], this.subColourIndex);
		this.objectTape[objectIndex].objects.push( new Line2(this.objectTape[objectIndex].geometry[partIndex], this.objectTape[objectIndex].materials[partIndex]) );
		this.objectTape[objectIndex].objects[partIndex].position.set(0,0,this.dimensions[2]);
		partIndex++;
		//left polly
		//Geometries
		this.objectTape[objectIndex].geometry.push( new LineGeometry() );
		this.objectTape[objectIndex].geometry[partIndex].setPositions( vertecies );
		this.objectTape[objectIndex].materials.push( new LineMaterial( {color: this.defaultColour, linewidth: this.lineWidth, worldUnits: true, vertexColors: false, alphaToCoverage: false} ) );
		this.objectTape[objectIndex].materials[partIndex].transparent = true;
		this.objectTape[objectIndex].materials[partIndex].opacity = this.lineOpacity;
		//colour
		this.setMaterialColour(this.objectTape[objectIndex].materials[partIndex], this.subColourIndex);
		this.objectTape[objectIndex].objects.push( new Line2(this.objectTape[objectIndex].geometry[partIndex], this.objectTape[objectIndex].materials[partIndex]) );
		this.objectTape[objectIndex].objects[partIndex].position.set(-this.dimensions[0],0,0);
		this.objectTape[objectIndex].objects[partIndex].rotateY(this.angleToRadian(90)  );
		partIndex++;
		//right polly
		//Geometries
		this.objectTape[objectIndex].geometry.push( new LineGeometry() );
		this.objectTape[objectIndex].geometry[partIndex].setPositions( vertecies );
		this.objectTape[objectIndex].materials.push( new LineMaterial( {color: this.defaultColour, linewidth: this.lineWidth, worldUnits: true, vertexColors: false, alphaToCoverage: false} ) );
		this.objectTape[objectIndex].materials[partIndex].transparent = true;
		this.objectTape[objectIndex].materials[partIndex].opacity = this.lineOpacity;
		//colour
		this.setMaterialColour(this.objectTape[objectIndex].materials[partIndex], this.subColourIndex);
		this.objectTape[objectIndex].objects.push( new Line2(this.objectTape[objectIndex].geometry[partIndex], this.objectTape[objectIndex].materials[partIndex]) );
		this.objectTape[objectIndex].objects[partIndex].position.set(this.dimensions[0],0,0);
		this.objectTape[objectIndex].objects[partIndex].rotateY(this.angleToRadian(90)  );
		partIndex++;
		//top polly
		//Geometries
		this.objectTape[objectIndex].geometry.push( new LineGeometry() );
		this.objectTape[objectIndex].geometry[partIndex].setPositions( vertecies );
		this.objectTape[objectIndex].materials.push( new LineMaterial( {color: this.defaultColour, linewidth: this.lineWidth, worldUnits: true, vertexColors: false, alphaToCoverage: false} ) );
		this.objectTape[objectIndex].materials[partIndex].transparent = true;
		this.objectTape[objectIndex].materials[partIndex].opacity = this.lineOpacity;
		//colour
		this.setMaterialColour(this.objectTape[objectIndex].materials[partIndex], this.subColourIndex);
		this.objectTape[objectIndex].objects.push( new Line2(this.objectTape[objectIndex].geometry[partIndex], this.objectTape[objectIndex].materials[partIndex]) );
		this.objectTape[objectIndex].objects[partIndex].position.set(0,-this.dimensions[1],0);
		this.objectTape[objectIndex].objects[partIndex].rotateX(this.angleToRadian(90)  );
		partIndex++;
		//bottom polly
		//Geometries
		this.objectTape[objectIndex].geometry.push( new LineGeometry() );
		this.objectTape[objectIndex].geometry[partIndex].setPositions( vertecies );
		this.objectTape[objectIndex].materials.push( new LineMaterial( {color: this.defaultColour, linewidth: this.lineWidth, worldUnits: true, vertexColors: false, alphaToCoverage: false} ) );
		this.objectTape[objectIndex].materials[partIndex].transparent = true;
		this.objectTape[objectIndex].materials[partIndex].opacity = this.lineOpacity;
		//colour
		this.setMaterialColour(this.objectTape[objectIndex].materials[partIndex], this.subColourIndex);
		this.objectTape[objectIndex].objects.push( new Line2(this.objectTape[objectIndex].geometry[partIndex], this.objectTape[objectIndex].materials[partIndex]) );
		this.objectTape[objectIndex].objects[partIndex].position.set(0,this.dimensions[1],0);
		this.objectTape[objectIndex].objects[partIndex].rotateX(this.angleToRadian(90)  );
		
		//bloom
		if(this.bloomEnable==1)
		{
			for(partIndex=0; partIndex<this.objectTape[objectIndex].objects.length; partIndex++)
			{
				this.objectTape[objectIndex].objects[partIndex].layers.enable( 1 );
				
			}
		}
		//add to local group
		for(partIndex=0; partIndex<this.objectTape[objectIndex].objects.length; partIndex++)
		{
			localGroup.add( this.objectTape[objectIndex].objects[partIndex] );	
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
	setMaterialColour = function(materialObject, colourIndex)
	{
		this.colourObject.getColour( colourIndex%this.colourObject._bandWidth );
		materialObject.color.r = this.colourObject._currentColour[0]/255;
		materialObject.color.g = this.colourObject._currentColour[1]/255;
		materialObject.color.b = this.colourObject._currentColour[2]/255;
	}
}
export default threeTriggerCube;