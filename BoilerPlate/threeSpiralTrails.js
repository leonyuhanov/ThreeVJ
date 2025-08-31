import * as THREE from 'three';
import envelopGenerator from './envelopGenerator.js';					//Envelop Generator
import CCGenerator from './CCGenerator.js';								//Colour System
import timerObject from './timerObject.js';								//Timers
import pixelMaper from './pixelMaper.js';								//Pixel Maper
import animationObject from './animationObject.js';						//Generic Object Tracking class
import ElipticalEnvelopGenerator from './ElipticalEnvelopGenerator.js';

class threeSpiralTrails
{	
	constructor()
	{
		//Main object stores
		this.objectTape = new Array();
		this.globalGroupArray = new Array();
		this.globalObjectGroup = new THREE.Object3D();
		this.groupName = "ST_";
		this.objectIDIndex = 0;
		this.genObject = new animationObject();
		
		//Global Three Objects form main System
		this.scene;
		
		//Main properties
		this.origin = [0,0,0];
		this.dimensions = [1,1,1];
		this.dimensionScalers = [1.1,1.1,1];
		this.rotationalVectors = [0,0,0];
		this.lineCount = 10;
		this.lineOpacity = 0.05;
		this.bloomLineModulus = 2;
		this.trails = 10;
		this.trailSpacing = 1;
		this.trailSpacingLFOEnable = 0;
		this.trailMotionIncrementRange = 0.5;
		this.setUpStatus = 0;
		this.multiObject = 0;
		
		//Utility Objects
		this.pixelMap = new pixelMaper(2,2);
		this.screenRange = [100,100,300];
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
	}
	animate = function(colourIncrement, subColourIncrement, trailSpeed, rotationalIncrements=[0,0,0],lineRotationSpeed, dimensionScalers=[1.1,1.1,1], rotationalIncrementScaler, trailSpacingLFO)
	{
		//creation loop
		this.orbitCreationLoop();
		if(this.setUpStatus==0){return;}
		
		var localObjectCounter=0, zIndex=0, vectorPoints, pointPos, trailIndex, trailCounter;
		var localDepth = this.screenRange[2]*(dimensionScalers[2]+0.01);
		var localZstart  = -(localDepth/2);
		var localTrailSpacing = this.trailSpacing;
		
		this.dimensionScalers = [dimensionScalers[0], dimensionScalers[1], rotationalIncrementScaler];
		for(localObjectCounter=0; localObjectCounter<this.objectTape.length; localObjectCounter++)
		{
			this.objectTape[localObjectCounter].shape = new Array();
			this.objectTape[localObjectCounter].motionIncrements[0] += lineRotationSpeed;
			for(zIndex=0; zIndex<localDepth; zIndex++)
			{
				pointPos = this.pixelMap.getElipticalPointsRaw(0, 0, this.objectTape[localObjectCounter].dimensions[0]+(this.dimensionScalers[0]*zIndex), this.objectTape[localObjectCounter].dimensions[1]+(this.dimensionScalers[1]*zIndex), (zIndex*this.dimensionScalers[2])-this.objectTape[localObjectCounter].motionIncrements[0]);
				vectorPoints = new THREE.Vector3(this.objectTape[localObjectCounter].position[0]+pointPos[1], pointPos[0], (localZstart)+zIndex);
				this.objectTape[localObjectCounter].shape.push(vectorPoints);
			}
			this.objectTape[localObjectCounter].geometry[0].dispose();
			this.objectTape[localObjectCounter].geometry[0].setFromPoints( this.objectTape[localObjectCounter].shape );
			//colour
			this.colourObject.getColour(this.subColourIndex%this.colourObject._bandWidth);
			this.objectTape[localObjectCounter].materials[0].color.r = this.colourObject._currentColour[0]/255;
			this.objectTape[localObjectCounter].materials[0].color.g = this.colourObject._currentColour[1]/255;
			this.objectTape[localObjectCounter].materials[0].color.b = this.colourObject._currentColour[2]/255;
			this.subColourIndex += subColourIncrement;
			//trail position
			this.objectTape[localObjectCounter].motionIncrements[1] = Math.round((this.objectTape[localObjectCounter].motionIncrements[1]+(this.objectTape[localObjectCounter].motionIncrements[2]*trailSpeed)))%this.objectTape[localObjectCounter].shape.length;
			trailIndex = this.objectTape[localObjectCounter].motionIncrements[1];
			this.subColourIndex = this.objectTape[localObjectCounter].colourIndex;
			if(this.trailSpacingLFOEnable==1)
			{
				localTrailSpacing = this.trailSpacing*this.lfo.read(localObjectCounter, trailSpacingLFO, 0)/100;
			}
			for(trailCounter=0; trailCounter<this.objectTape[localObjectCounter].pollyPoints; trailCounter++)
			{
				trailIndex = Math.round(((this.objectTape[localObjectCounter].motionIncrements[1]+(trailCounter*localTrailSpacing)))) %this.objectTape[localObjectCounter].shape.length;
				this.objectTape[localObjectCounter].objects[trailCounter+1].position.set(this.objectTape[localObjectCounter].shape[trailIndex].x, this.objectTape[localObjectCounter].shape[trailIndex].y, this.objectTape[localObjectCounter].shape[trailIndex].z);
				//colour
				this.colourObject.getColour(this.objectTape[localObjectCounter].colourIndex%this.colourObject._bandWidth);
				this.objectTape[localObjectCounter].materials[trailCounter+1].color.r = this.colourObject._currentColour[0]/255;
				this.objectTape[localObjectCounter].materials[trailCounter+1].color.g = this.colourObject._currentColour[1]/255;
				this.objectTape[localObjectCounter].materials[trailCounter+1].color.b = this.colourObject._currentColour[2]/255;
				this.objectTape[localObjectCounter].colourIndex += subColourIncrement;
			}
			
			this.subColourIndex += subColourIncrement;
			this.objectTape[localObjectCounter].colourIndex = this.subColourIndex;
		}
		this.colourIndex += colourIncrement;
		this.subColourIndex = this.colourIndex;
		//tempRotationalVectors[0] = this.rotationalVectors[0]*rotationalIncrements[0];
		//tempRotationalVectors[1] = this.rotationalVectors[1]*rotationalIncrements[1];
		//tempRotationalVectors[2] = this.rotationalVectors[2]*rotationalIncrements[2];
	
		this.globalObjectGroup.rotateX( (rotationalIncrements[0])*(Math.PI/180) );
		this.globalObjectGroup.rotateY( (rotationalIncrements[1])*(Math.PI/180) );
		this.globalObjectGroup.rotateZ( (rotationalIncrements[2])*(Math.PI/180) );
		
		
	}
	updatePath = function(radiusScale, xScale=1, yScale=1)
	{
		if(this.setUpStatus==0){return;}
		/*
		var localObjectCounter=0, lpCounter, elipsePoints, tempPoints = new THREE.Vector2( 0, 0 );
		var pointPos;		
		this.scale = [radiusScale, xScale, yScale];
		
		for(localObjectCounter=0; localObjectCounter<this.objectTape.length/2; localObjectCounter++)
		{
			//this.objectTape[localObjectCounter].shape[0] = new THREE.Shape();
			pointPos = this.pixelMap.getCircularPointsRaw(0,0,this.radius*this.scale[0], (((180/this.objectTape[localObjectCounter].pollyPoints)*localObjectCounter)+this.objectTape[localObjectCounter].motionIncrements[0])%180);
			this.objectTape[localObjectCounter].dimensions = [pointPos[0]*this.scale[1],pointPos[0]*this.scale[2],0];
			this.objectTape[localObjectCounter].shape = new Array();
			for(lpCounter=0; lpCounter<this.sliceAcuracy+1; lpCounter++)
			{
				elipsePoints = this.pixelMap.getElipticalPointsRaw(this.objectTape[localObjectCounter].position[0], this.objectTape[localObjectCounter].position[1], this.objectTape[localObjectCounter].dimensions[0], this.objectTape[localObjectCounter].dimensions[1], (360/this.sliceAcuracy)*lpCounter);
				tempPoints = new THREE.Vector2( elipsePoints[0], elipsePoints[1] );
				this.objectTape[localObjectCounter].shape.push(tempPoints);
			}
			this.objectTape[localObjectCounter].geometry[0].setFromPoints( this.objectTape[localObjectCounter].shape );
			this.objectTape[localObjectCounter].objects[0].position.set(0,0, pointPos[1]);
			this.objectTape[localObjectCounter].position[2] = pointPos[1];
		}
		*/
	}
	insertSpiral = function()
	{
		var objectCounter=0, trailCounter=0;
		var zIndex=0, vectorPoints, pointPos;
		var localGroup;
		var elipsePoints, tempPoints = new THREE.Vector2( 0, 0 );
		
		for(objectCounter=0; objectCounter<this.lineCount; objectCounter++)
		{
			localGroup = new THREE.Object3D();
			this.objectTape.push( new animationObject() );
			this.objectTape[objectCounter].position = [0,0,0];
			this.objectTape[objectCounter].dimensions = [this.dimensions[0],this.dimensions[1],this.dimensions[2]];
			this.objectTape[objectCounter].pollyPoints = this.trails;
			this.objectTape[objectCounter].motionIncrements[0] = (360/this.lineCount)*objectCounter;
			this.objectTape[objectCounter].motionIncrements[2] = this.trailMotionIncrementRange+Math.random()*this.trailMotionIncrementRange;
			this.objectTape[objectCounter].colourIndex = this.colourIndex+(objectCounter*50);
			for(zIndex=0; zIndex<this.screenRange[2]*2; zIndex++)
			{
				pointPos = this.pixelMap.getElipticalPointsRaw(0, 0, this.objectTape[objectCounter].dimensions[0]+(this.dimensionScalers[0]*zIndex), this.objectTape[objectCounter].dimensions[1]+(this.dimensionScalers[1]*zIndex), this.objectTape[objectCounter].dimensions[2]*zIndex);
				vectorPoints = new THREE.Vector3(this.objectTape[objectCounter].position[0]+pointPos[1], pointPos[0], (-this.screenRange[2])+zIndex);
				this.objectTape[objectCounter].shape.push(vectorPoints);
			}
			this.objectTape[objectCounter].motionIncrements[1] = Math.round(Math.random()*this.objectTape[objectCounter].shape.length);
			this.objectTape[objectCounter].geometry.push(  new THREE.BufferGeometry().setFromPoints( this.objectTape[objectCounter].shape ));
			this.objectTape[objectCounter].materials.push( new THREE.LineBasicMaterial({color: 0xffffff}) );
			this.objectTape[objectCounter].materials[0].transparent = true;
			this.objectTape[objectCounter].materials[0].opacity = this.lineOpacity;
			this.objectTape[objectCounter].objects.push( new THREE.Line(this.objectTape[objectCounter].geometry[0], this.objectTape[objectCounter].materials[0]) );
			if(objectCounter%this.bloomLineModulus==this.bloomLineModulus-1)
			{
				this.objectTape[objectCounter].objects[0].layers.enable( 1 );
			}
			localGroup.add(this.objectTape[objectCounter].objects[0]);
			//add LFO for trail spacing
			this.lfo.addWithTimeCode(objectCounter, [100], [Math.random()*200+50], 0, 0);
			//add trails
			
			for(trailCounter=0; trailCounter<this.objectTape[objectCounter].pollyPoints; trailCounter++)
			{
				this.objectTape[objectCounter].geometry.push(  new THREE.SphereGeometry(1, 30, 30));
				this.objectTape[objectCounter].materials.push( new THREE.MeshLambertMaterial({color: 0xffffff}) );
				this.objectTape[objectCounter].materials[trailCounter+1].transparent = true;
				this.objectTape[objectCounter].materials[trailCounter+1].opacity = (trailCounter/this.objectTape[objectCounter].pollyPoints);
				this.objectTape[objectCounter].objects.push( new THREE.Line(this.objectTape[objectCounter].geometry[trailCounter+1], this.objectTape[objectCounter].materials[trailCounter+1]) );
				this.objectTape[objectCounter].objects[trailCounter+1].position.set(this.objectTape[objectCounter].shape[0].x, this.objectTape[objectCounter].shape[0].y, this.objectTape[objectCounter].shape[0].z);
				this.objectTape[objectCounter].objects[trailCounter+1].layers.enable( 1 );
				this.objectTape[objectCounter].objects[trailCounter+1].scale.x = 1+(0.095*trailCounter);
				this.objectTape[objectCounter].objects[trailCounter+1].scale.y = 1+(0.095*trailCounter);
				this.objectTape[objectCounter].objects[trailCounter+1].scale.z = 1+(0.095*trailCounter);
				localGroup.add(this.objectTape[objectCounter].objects[trailCounter+1]);
			}
			
			this.globalGroupArray.push( localGroup );
			this.globalObjectGroup.add( localGroup );
		}
		//complete set up
		this.globalObjectGroup.position.x =  this.origin[0];
		this.globalObjectGroup.position.y =  this.origin[1];
		this.globalObjectGroup.position.z =  this.origin[2];

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
		this.create = 0;
	}
	orbitCreationLoop = function()
	{
		if(this.setUpStatus==0)
		{
			this.insertSpiral();
		}
	}
}
export default threeSpiralTrails;