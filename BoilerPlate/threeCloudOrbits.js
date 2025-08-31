import * as THREE from 'three';
import envelopGenerator from './envelopGenerator.js';					//Envelop Generator
import CCGenerator from './CCGenerator.js';								//Colour System
import timerObject from './timerObject.js';								//Timers
import pixelMaper from './pixelMaper.js';								//Pixel Maper
import animationObject from './animationObject.js';						//Generic Object Tracking class
import ElipticalEnvelopGenerator from './ElipticalEnvelopGenerator.js';

class threeCloudOrbits
{	
	constructor()
	{
		//Main object stores
		this.objectTape = new Array();
		this.globalGroupArray = new Array();
		this.globalObjectGroup = new THREE.Object3D();
		this.groupName = "CO_";
		this.objectIDIndex = 0;
		this.genObject = new animationObject();
		
		//Global Three Objects form main System
		this.scene;
		
		//Main properties
		this.origin = [0,0,0];
		this.dimensions = [100,200];
		this.particleCount = 50;
		this.cloudTightness = [10,10,10];
		this.orbitSpeed = 0.001;
		this.orbitIndex = 0;
		this.pointFiness = 100;
		this.orbitPathOpacity = 0.2;
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
		this.previousControls = [1,1,1];
		
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
		//this.lfo.addWithTimeCode("opacityLFO", [100], [100], 0, 0);
	}
	getCloudPosition = function(positionIndex)
	{
		var pointSpot = new THREE.Vector3(0,0,0);
		
		if(positionIndex==0)
		{
			this.objectTape[0].objects[1].getWorldPosition(pointSpot);
			return pointSpot;
		}
		else
		{
			this.objectTape[0].objects[1].getWorldDirection(pointSpot);
			return pointSpot;
		}
	}
	animate = function(colourControls, controlData, rotationalIncrements=[0,0,0])
	{
		//controlData[0] object scale
		//controlData[1] path width scale
		//controlData[2] path height scale
		//controlData[3] cloud orbit speed
		//controlData[4] cloud rotate speed
		//controlData[5] orbit opacity
		//controlData[6] particle scale
		
		if(this.setUpStatus==0){return;}
		
		var objectIndex=0, partIndex=1, pointSpot = new THREE.Vector2(0,0);
		var motionSpeed = this.orbitSpeed * controlData[3];
		
		//orbit scaling
		if(this.previousControls[0]!=controlData[0] || this.previousControls[1]!=controlData[1] || this.previousControls[2]!=controlData[2])
		{
			//save control values for perfomance
			this.previousControls[0] = controlData[0];
			this.previousControls[1] = controlData[1];
			this.previousControls[2] = controlData[2];
			//delete the object from teh scene
			this.globalObjectGroup.remove( this.objectTape[objectIndex].objects[0] );
			//recreate the orbit path
			this.objectTape[objectIndex].shape[0] = new THREE.EllipseCurve(0, 0, (this.objectTape[objectIndex].dimensions[0]*controlData[0])*controlData[1], (this.objectTape[objectIndex].dimensions[1]*controlData[0])*controlData[2], 0,  2 * Math.PI, false, 0);
			this.objectTape[objectIndex].geometry[0].setFromPoints(  this.objectTape[objectIndex].shape[0].getPoints( this.pointFiness ) );
			this.objectTape[objectIndex].objects[0] = new THREE.Line(this.objectTape[objectIndex].geometry[0], this.objectTape[objectIndex].materials[0]);
			this.objectTape[objectIndex].objects[0].rotateX( this.angleToRadian( this.rotateTo[0] ) );
			this.objectTape[objectIndex].objects[0].rotateY( this.angleToRadian( this.rotateTo[1] ) );
			this.objectTape[objectIndex].objects[0].rotateZ( this.angleToRadian( this.rotateTo[2] ) );
			if(this.bloomEnable==1)
			{
				this.objectTape[objectIndex].objects[0].layers.enable( 1 );
			}
			this.globalObjectGroup.add( this.objectTape[objectIndex].objects[0] );
		}
		//cloud motion
		this.orbitIndex = (this.orbitIndex+motionSpeed)%1;
		this.objectTape[objectIndex].shape[0].getPoint( this.orbitIndex, pointSpot);
		this.objectTape[objectIndex].objects[partIndex].position.set(pointSpot.x, pointSpot.y, 0);
		//cloud rotation
		this.objectTape[objectIndex].objects[partIndex].rotateX( this.angleToRadian(this.objectTape[objectIndex].rotations[0]*controlData[4]) );
		this.objectTape[objectIndex].objects[partIndex].rotateY( this.angleToRadian(this.objectTape[objectIndex].rotations[1]*controlData[4]) );
		this.objectTape[objectIndex].objects[partIndex].rotateZ( this.angleToRadian(this.objectTape[objectIndex].rotations[2]*controlData[4]) );
		//cloud particle size
		this.objectTape[objectIndex].materials[partIndex].size = controlData[6];

		this.globalObjectGroup.rotateX( (rotationalIncrements[0])*(Math.PI/180) );
		this.globalObjectGroup.rotateY( (rotationalIncrements[1])*(Math.PI/180) );
		this.globalObjectGroup.rotateZ( (rotationalIncrements[2])*(Math.PI/180) );	
		
		//orbit opacity
		this.objectTape[objectIndex].materials[0].opacity = controlData[5];

		this.colourIndex += colourControls[0];
		this.subColourIndex = this.colourIndex;
	}
	insertObject = function()
	{
		var objectIndex=0, partIndex=0, pointPos, axisPos, objectAngle=0, axisAngle, vertecies = new Array();
		var pIndex=0, pointLocation = [0,0,0], pointSpot = new THREE.Vector2(0,0);
		var localGroup = new THREE.Object3D();
		
		this.objectTape.push( new animationObject() );
		this.objectTape[objectIndex].objectID = this.groupName+this.objectIDIndex;
		this.objectTape[objectIndex].pollyPoints = this.particleCount;
		this.objectTape[objectIndex].dimensions = [this.dimensions[0], this.dimensions[1], 0];
		this.objectTape[objectIndex].rotations = [Math.random(),Math.random(),Math.random()];
		
		//create the orbital elypse
		this.objectTape[objectIndex].shape.push( new THREE.EllipseCurve(0, 0, this.objectTape[objectIndex].dimensions[0], this.objectTape[objectIndex].dimensions[1], 0,  2 * Math.PI, false, 0) );
		this.objectTape[objectIndex].geometry.push( new THREE.BufferGeometry().setFromPoints(  this.objectTape[objectIndex].shape[0].getPoints( this.pointFiness ) ) );
		this.objectTape[objectIndex].materials.push( new THREE.LineBasicMaterial( {color: 0xffffff} ) );
		this.objectTape[objectIndex].materials[partIndex].transparent = true;
		this.objectTape[objectIndex].materials[partIndex].opacity = this.orbitPathOpacity;
		//colour
		this.colourObject.getColour( this.colourIndex%this.colourObject._bandWidth );
		this.objectTape[objectIndex].materials[partIndex].color.r = this.colourObject._currentColour[0]/255;
		this.objectTape[objectIndex].materials[partIndex].color.g = this.colourObject._currentColour[1]/255;
		this.objectTape[objectIndex].materials[partIndex].color.b = this.colourObject._currentColour[2]/255;
		this.objectTape[objectIndex].objects.push( new THREE.Line(this.objectTape[objectIndex].geometry[partIndex], this.objectTape[objectIndex].materials[partIndex]) );
		if(this.bloomEnable==1)
		{
			this.objectTape[objectIndex].objects[partIndex].layers.enable( 1 );
		}
		localGroup.add( this.objectTape[objectIndex].objects[partIndex] );
		
		//create orbiting particle cloud
		partIndex++;
		for(pIndex=0; pIndex<this.objectTape[objectIndex].pollyPoints; pIndex++)
		{
			//generate a random particle location
			this.generatedirectionalVectors();
			pointLocation[0] = (Math.random()*this.cloudTightness[0])*this.directionalVectors[0];
			pointLocation[1] = (Math.random()*this.cloudTightness[1])*this.directionalVectors[1];
			pointLocation[2] = (Math.random()*this.cloudTightness[2])*this.directionalVectors[2];
			vertecies.push(pointLocation[0],pointLocation[1], pointLocation[2]);
		}
		this.objectTape[objectIndex].geometry.push( new THREE.BufferGeometry() );
		this.objectTape[objectIndex].geometry[partIndex].setAttribute( 'position', new THREE.Float32BufferAttribute( vertecies , 3 ) );
		this.objectTape[objectIndex].materials.push( new THREE.PointsMaterial( { color: 0xffffff, size: 1} ) );
		this.objectTape[objectIndex].materials[partIndex].transparent = true;
		this.objectTape[objectIndex].materials[partIndex].opacity = 1;
		//colour
		this.objectTape[objectIndex].materials[partIndex].color.r = this.colourObject._currentColour[0]/255;
		this.objectTape[objectIndex].materials[partIndex].color.g = this.colourObject._currentColour[1]/255;
		this.objectTape[objectIndex].materials[partIndex].color.b = this.colourObject._currentColour[2]/255;
		this.objectTape[objectIndex].objects.push( new THREE.Points( this.objectTape[objectIndex].geometry[partIndex], this.objectTape[objectIndex].materials[partIndex] ) );
		this.objectTape[objectIndex].objects[partIndex].layers.enable( 1 );
		this.objectTape[objectIndex].shape[0].getPoint( this.orbitIndex, pointSpot);
		this.objectTape[objectIndex].objects[partIndex].position.set(pointSpot.x, pointSpot.y, 0);
		localGroup.add( this.objectTape[objectIndex].objects[partIndex] );
		
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
export default threeCloudOrbits;