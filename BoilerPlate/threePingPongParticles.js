import * as THREE from 'three';
import envelopGenerator from './envelopGenerator.js';					//Envelop Generator
import CCGenerator from './CCGenerator.js';								//Colour System
import timerObject from './timerObject.js';								//Timers
import pixelMaper from './pixelMaper.js';								//Pixel Maper
import animationObject from './animationObject.js';						//Generic Object Tracking class
import ElipticalEnvelopGenerator from './ElipticalEnvelopGenerator.js';

class threePingPongParticles
{	
	constructor()
	{
		//Main object stores
		this.objectTape = new Array();
		this.globalGroupArray = new Array();
		this.globalObjectGroup = new THREE.Object3D();
		this.groupName = "PT_";
		this.objectIDIndex = 0;
		this.genObject = new animationObject();
		
		//Global Three Objects form main System
		this.scene;
		
		//Main properties
		this.origin = [0,0,0];
		this.radius = 100;
		this.endPointRadius = this.radius/2;
		this.numberOfParticles = 40;
		this.particleSpacing = 5;
		this.particlePoints = new Array();
		this.circleFiness = 30;
		this.exploderFitness = 90;
		this.segmentsPerCircle = 4;
		this.segmentPop = 0;
		this.rotateByWhenHit = 2;
		this.maxExplosiveRadius = 100;
		this.explodeBy = 1;
		this.multiObject = 0;
		
		//Utility Objects
		this.pixelMap = new pixelMaper(2,2);
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
		this.lfo.addWithTimeCode("segmentPop", [100], [50], 2, 0);
	}
	animate = function(colourIncrement, subColourIncrement, controlData, rotationalIncrements=[0,0,0])
	{
		//creation loop
		//this.orbitCreationLoop();
		if(this.setUpStatus==0){return;}
		var localObjectCounter=0, pointPos, particleCounter, verticies, tempRadius, pointCounter, circleTempRadius=[0,0], circeSegmentSpacer, subPointCounter;
		var tempDimenions = [0,0], tempRotationSpeed = this.rotateByWhenHit*controlData[2];
		
		//main point animation
		//colour
		this.colourObject.getColour(this.subColourIndex%this.colourObject._bandWidth);
		this.objectTape[localObjectCounter].materials[0].color.r = this.colourObject._currentColour[0]/255;
		this.objectTape[localObjectCounter].materials[0].color.g = this.colourObject._currentColour[1]/255;
		this.objectTape[localObjectCounter].materials[0].color.b = this.colourObject._currentColour[2]/255;
		this.subColourIndex += subColourIncrement;
		verticies = new Array();
		tempRadius = (this.radius*controlData[0]);
		for(particleCounter=0; particleCounter<this.particlePoints.length; particleCounter++)
		{
			pointPos = this.pixelMap.getElipticalPointsRaw(0,0,tempRadius,tempRadius, this.particlePoints[particleCounter][3]);
			if(this.particlePoints[particleCounter][1]+(controlData[1]*this.particlePoints[particleCounter][4]) <pointPos[1] && this.particlePoints[particleCounter][3]==180)
			{
				this.particlePoints[particleCounter][1] += (controlData[1]*this.particlePoints[particleCounter][4]);
			}
			else if(this.particlePoints[particleCounter][1]-(controlData[1]*this.particlePoints[particleCounter][4])>pointPos[1] && this.particlePoints[particleCounter][3]==0)
			{
				this.particlePoints[particleCounter][1] -= (controlData[1]*this.particlePoints[particleCounter][4]);
			}
			else
			{
				if( this.particlePoints[particleCounter][3]==180 )
				{
					//Upper hit
					this.objectTape[localObjectCounter+1].pointAngleOffset += tempRotationSpeed;
					this.objectTape[localObjectCounter+1].motionIncrements[0]++;
					this.particlePoints[particleCounter][3]=0;
				}
				else
				{
					//Lower hit
					this.objectTape[localObjectCounter+2].pointAngleOffset += tempRotationSpeed;
					this.objectTape[localObjectCounter+2].motionIncrements[0]++;
					this.particlePoints[particleCounter][3]=180;
				}
			}
			verticies.push(this.particlePoints[particleCounter][0], this.particlePoints[particleCounter][1], this.particlePoints[particleCounter][2]);
		}
		this.objectTape[localObjectCounter].geometry[0].setAttribute( 'position', new THREE.Float32BufferAttribute( verticies , 3 ) );		
		//Upper Circle Animation
		circeSegmentSpacer = (360-(this.circleFiness*this.objectTape[localObjectCounter+1].pollyPoints))/this.objectTape[localObjectCounter+1].pollyPoints;
		//Segment lfo if triggered
		tempDimenions[0] = (this.lfo.read("segmentPop", 1, 0)/100)*(this.endPointRadius);
		tempDimenions[1] = tempDimenions[0];
		for(pointCounter=0; pointCounter<this.objectTape[localObjectCounter+1].pollyPoints; pointCounter++)
		{
			verticies = new Array();
			for(subPointCounter=0; subPointCounter<this.circleFiness; subPointCounter++)
			{
				if(pointCounter==(this.segmentPop%this.segmentsPerCircle))
				{
					pointPos = this.pixelMap.getElipticalPointsRaw(0,0,(this.objectTape[localObjectCounter+1].dimensions[0]+tempDimenions[0])*controlData[0],(this.objectTape[localObjectCounter+1].dimensions[1]+tempDimenions[1])*controlData[0], ((circeSegmentSpacer+this.circleFiness)*pointCounter)+subPointCounter+this.objectTape[localObjectCounter+1].pointAngleOffset);
				}
				else
				{
					pointPos = this.pixelMap.getElipticalPointsRaw(0,0,this.objectTape[localObjectCounter+1].dimensions[0]*controlData[0],this.objectTape[localObjectCounter+1].dimensions[1]*controlData[0], ((circeSegmentSpacer+this.circleFiness)*pointCounter)+subPointCounter+this.objectTape[localObjectCounter+1].pointAngleOffset);
				}
				verticies.push( new THREE.Vector3(pointPos[0], tempRadius, pointPos[1]) );
			}
			this.objectTape[localObjectCounter+1].geometry[pointCounter].setFromPoints( verticies );
			this.colourObject.getColour(this.subColourIndex%this.colourObject._bandWidth);
			this.objectTape[localObjectCounter+1].materials[pointCounter].color.r = this.colourObject._currentColour[0]/255;
			this.objectTape[localObjectCounter+1].materials[pointCounter].color.g = this.colourObject._currentColour[1]/255;
			this.objectTape[localObjectCounter+1].materials[pointCounter].color.b = this.colourObject._currentColour[2]/255;
			this.subColourIndex += subColourIncrement;
		}
		//Lower Circle Animation
		circeSegmentSpacer = (360-(this.circleFiness*this.objectTape[localObjectCounter+2].pollyPoints))/this.objectTape[localObjectCounter+2].pollyPoints;
		for(pointCounter=0; pointCounter<this.objectTape[localObjectCounter+2].pollyPoints; pointCounter++)
		{
			verticies = new Array();
			for(subPointCounter=0; subPointCounter<this.circleFiness; subPointCounter++)
			{
				if(pointCounter==(this.segmentPop%this.segmentsPerCircle))
				{
					pointPos = this.pixelMap.getElipticalPointsRaw(0,0,(this.objectTape[localObjectCounter+2].dimensions[0]+tempDimenions[0])*controlData[0],(this.objectTape[localObjectCounter+2].dimensions[1]+tempDimenions[1])*controlData[0], ((circeSegmentSpacer+this.circleFiness)*pointCounter)+subPointCounter-this.objectTape[localObjectCounter+2].pointAngleOffset);
				}
				else
				{
					pointPos = this.pixelMap.getElipticalPointsRaw(0,0,this.objectTape[localObjectCounter+2].dimensions[0]*controlData[0],this.objectTape[localObjectCounter+2].dimensions[1]*controlData[0], ((circeSegmentSpacer+this.circleFiness)*pointCounter)+subPointCounter-this.objectTape[localObjectCounter+2].pointAngleOffset);
				}
				verticies.push( new THREE.Vector3(pointPos[0], -tempRadius, pointPos[1]) );
			}
			this.objectTape[localObjectCounter+2].geometry[pointCounter].setFromPoints( verticies );
			this.colourObject.getColour(this.subColourIndex%this.colourObject._bandWidth);
			this.objectTape[localObjectCounter+2].materials[pointCounter].color.r = this.colourObject._currentColour[0]/255;
			this.objectTape[localObjectCounter+2].materials[pointCounter].color.g = this.colourObject._currentColour[1]/255;
			this.objectTape[localObjectCounter+2].materials[pointCounter].color.b = this.colourObject._currentColour[2]/255;
			this.subColourIndex += subColourIncrement;
		}
		//check for exploders if all particles have hit a surface
		if(this.objectTape[localObjectCounter+1].motionIncrements[0]>=this.numberOfParticles)
		{
			//reset surface counter
			this.objectTape[localObjectCounter+1].motionIncrements[0]=0;
			//start growth of exploder
			this.objectTape[localObjectCounter+3].motionIncrements[0]=1;
		}
		if(this.objectTape[localObjectCounter+2].motionIncrements[0]>=this.numberOfParticles)
		{
			//reset surface counter
			this.objectTape[localObjectCounter+2].motionIncrements[0]=0;
			//start growth of exploder
			this.objectTape[localObjectCounter+4].motionIncrements[0]=1;
		}
		//exploders - top
		this.colourObject.getColour(this.subColourIndex%this.colourObject._bandWidth);
		this.objectTape[localObjectCounter+3].materials[0].color.r = this.colourObject._currentColour[0]/255;
		this.objectTape[localObjectCounter+3].materials[0].color.g = this.colourObject._currentColour[1]/255;
		this.objectTape[localObjectCounter+3].materials[0].color.b = this.colourObject._currentColour[2]/255;
		if(this.objectTape[localObjectCounter+3].motionIncrements[0]==1)
		{
			this.objectTape[localObjectCounter+3].dimensions[0]+=this.explodeBy;
			this.objectTape[localObjectCounter+3].dimensions[1]+=this.explodeBy;
			if(this.objectTape[localObjectCounter+3].dimensions[0]>=this.objectTape[localObjectCounter+3].radius || this.objectTape[localObjectCounter+3].dimensions[1]>=this.objectTape[localObjectCounter+3].radius)
			{
				this.objectTape[localObjectCounter+3].dimensions = [0,0,0];
				this.objectTape[localObjectCounter+3].motionIncrements[0]=0;
			}
		}
		verticies = new Array();
		for(subPointCounter=0; subPointCounter<this.exploderFitness; subPointCounter++)
		{
			pointPos = this.pixelMap.getElipticalPointsRaw(0,0,this.objectTape[localObjectCounter+3].dimensions[0],this.objectTape[localObjectCounter+3].dimensions[1], (360/this.exploderFitness)*subPointCounter);
			verticies.push( new THREE.Vector3(pointPos[0], tempRadius, pointPos[1]) );
		}
		verticies.push(verticies[0]);
		this.objectTape[localObjectCounter+3].geometry[0].setFromPoints( verticies );
		this.objectTape[localObjectCounter+3].materials[0].opacity = 1-(this.objectTape[localObjectCounter+3].dimensions[0]/this.objectTape[localObjectCounter+3].radius);
		//exploders - bottom
		this.colourObject.getColour(this.subColourIndex%this.colourObject._bandWidth);
		this.objectTape[localObjectCounter+4].materials[0].color.r = this.colourObject._currentColour[0]/255;
		this.objectTape[localObjectCounter+4].materials[0].color.g = this.colourObject._currentColour[1]/255;
		this.objectTape[localObjectCounter+4].materials[0].color.b = this.colourObject._currentColour[2]/255;
		if(this.objectTape[localObjectCounter+4].motionIncrements[0]==1)
		{
			this.objectTape[localObjectCounter+4].dimensions[0]+=this.explodeBy;
			this.objectTape[localObjectCounter+4].dimensions[1]+=this.explodeBy;
			if(this.objectTape[localObjectCounter+4].dimensions[0]>=this.objectTape[localObjectCounter+4].radius || this.objectTape[localObjectCounter+4].dimensions[1]>=this.objectTape[localObjectCounter+4].radius)
			{
				this.objectTape[localObjectCounter+4].dimensions = [0,0,0];
				this.objectTape[localObjectCounter+4].motionIncrements[0]=0;
			}
		}
		verticies = new Array();
		for(subPointCounter=0; subPointCounter<this.exploderFitness; subPointCounter++)
		{
			pointPos = this.pixelMap.getElipticalPointsRaw(0,0,this.objectTape[localObjectCounter+4].dimensions[0],this.objectTape[localObjectCounter+4].dimensions[1], (360/this.exploderFitness)*subPointCounter);
			verticies.push( new THREE.Vector3(pointPos[0], -tempRadius, pointPos[1]) );
		}
		verticies.push(verticies[0]);
		this.objectTape[localObjectCounter+4].geometry[0].setFromPoints( verticies );
		this.objectTape[localObjectCounter+4].materials[0].opacity = 1-(this.objectTape[localObjectCounter+4].dimensions[0]/this.objectTape[localObjectCounter+4].radius);

		
		
		

		
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
		var particleCounter, verticies, pointPos, motionNoise = [1,1,1], objectIndex=0, pointCounter, subPointCounter, circeSegmentSpacer;
		var localGroup;
		
		localGroup = new THREE.Object3D();
		this.objectTape.push( new animationObject() );
		this.objectTape[objectIndex].objectID = this.groupName+this.objectIDIndex;
		this.objectTape[objectIndex].position = [this.origin[0],this.origin[1],this.origin[2]];
		this.objectTape[objectIndex].radius = this.radius;

		verticies = new Array();
		for(particleCounter=0; particleCounter<this.numberOfParticles; particleCounter++)
		{
			this.generatedirectionalVectors();
			motionNoise[0] = (Math.random()*this.particleSpacing)*this.directionalVectors[0];
			motionNoise[1] = (Math.random()*this.particleSpacing)*this.directionalVectors[1];
			motionNoise[2] = (Math.random()*this.particleSpacing)*this.directionalVectors[2];
			this.particlePoints.push([this.origin[0]+motionNoise[0], this.origin[1]+motionNoise[1],  this.origin[2]+motionNoise[2], 180, (Math.random()+0.1)]);
			verticies.push( this.origin[0]+motionNoise[0], this.origin[1]+motionNoise[1],  this.origin[2]+motionNoise[2] );
		}
		this.objectTape[objectIndex].geometry.push(new THREE.BufferGeometry());
		this.objectTape[objectIndex].materials.push( new THREE.PointsMaterial({color: 0xffffff, size: 1 }) );
		this.objectTape[objectIndex].materials[0].transparent = true;
		this.objectTape[objectIndex].materials[0].opacity = 1;
		this.objectTape[objectIndex].geometry[0].setAttribute( 'position', new THREE.Float32BufferAttribute( verticies , 3 ) );
		this.objectTape[objectIndex].objects.push( new THREE.Points(this.objectTape[objectIndex].geometry[0], this.objectTape[objectIndex].materials[0]) );
		this.objectTape[objectIndex].objects[0].layers.enable( 1 );
		localGroup.add( this.objectTape[objectIndex].objects[0] );
		objectIndex++;
		//insert hidden top circle
		this.objectTape.push( new animationObject() );
		this.objectTape[objectIndex].dimensions = [this.endPointRadius,this.endPointRadius];
		this.objectTape[objectIndex].motionIncrements = [0,0,0];
		this.objectTape[objectIndex].pointAngleOffset = 0;
		this.objectTape[objectIndex].pollyPoints = this.segmentsPerCircle;
		circeSegmentSpacer = (360-(this.circleFiness*this.objectTape[objectIndex].pollyPoints))/this.objectTape[objectIndex].pollyPoints;
		for(pointCounter=0; pointCounter<this.objectTape[objectIndex].pollyPoints; pointCounter++)
		{
			verticies = new Array();
			for(subPointCounter=0; subPointCounter<this.circleFiness; subPointCounter++)
			{
				pointPos = this.pixelMap.getElipticalPointsRaw(0,0,this.objectTape[objectIndex].dimensions[0],this.objectTape[objectIndex].dimensions[1], ((circeSegmentSpacer+this.circleFiness)*pointCounter)+subPointCounter);
				verticies.push( new THREE.Vector3(pointPos[0], this.radius, pointPos[1]) );
			}
			this.objectTape[objectIndex].geometry.push(new THREE.BufferGeometry().setFromPoints( verticies ));
			this.objectTape[objectIndex].materials.push( new THREE.LineBasicMaterial({color: 0xffffff}) );
			this.objectTape[objectIndex].objects.push( new THREE.Line(this.objectTape[objectIndex].geometry[pointCounter], this.objectTape[objectIndex].materials[pointCounter]) );
			this.objectTape[objectIndex].objects[pointCounter].layers.enable( 1 );
			localGroup.add( this.objectTape[objectIndex].objects[pointCounter] );
		}
		objectIndex++;
		//insert hidden bottom circle
		this.objectTape.push( new animationObject() );
		this.objectTape[objectIndex].dimensions = [this.endPointRadius,this.endPointRadius];
		this.objectTape[objectIndex].motionIncrements = [0,0,0];
		this.objectTape[objectIndex].pointAngleOffset = 0;
		this.objectTape[objectIndex].pollyPoints = this.segmentsPerCircle;
		circeSegmentSpacer = (360-(this.circleFiness*this.objectTape[objectIndex].pollyPoints))/this.objectTape[objectIndex].pollyPoints;
		for(pointCounter=0; pointCounter<this.objectTape[objectIndex].pollyPoints; pointCounter++)
		{
			verticies = new Array();
			for(subPointCounter=0; subPointCounter<this.circleFiness; subPointCounter++)
			{
				pointPos = this.pixelMap.getElipticalPointsRaw(0,0,this.objectTape[objectIndex].dimensions[0],this.objectTape[objectIndex].dimensions[1], ((circeSegmentSpacer+this.circleFiness)*pointCounter)+subPointCounter);
				verticies.push( new THREE.Vector3(pointPos[0], -this.radius, pointPos[1]) );
			}
			this.objectTape[objectIndex].geometry.push(new THREE.BufferGeometry().setFromPoints( verticies ));
			this.objectTape[objectIndex].materials.push( new THREE.LineBasicMaterial({color: 0xffffff}) );
			this.objectTape[objectIndex].objects.push( new THREE.Line(this.objectTape[objectIndex].geometry[pointCounter], this.objectTape[objectIndex].materials[pointCounter]) );
			this.objectTape[objectIndex].objects[pointCounter].layers.enable( 1 );
			localGroup.add( this.objectTape[objectIndex].objects[pointCounter] );
		}
		objectIndex++;
		//insert hidden top exploder
		this.objectTape.push( new animationObject() );
		this.objectTape[objectIndex].dimensions = [0,0];
		this.objectTape[objectIndex].radius = this.maxExplosiveRadius;
		this.objectTape[objectIndex].motionIncrements = [0,0,0];
		verticies = new Array();
		for(subPointCounter=0; subPointCounter<this.exploderFitness; subPointCounter++)
		{
			pointPos = this.pixelMap.getElipticalPointsRaw(0,0,this.objectTape[objectIndex].dimensions[0],this.objectTape[objectIndex].dimensions[1], (360/this.exploderFitness)*subPointCounter);
			verticies.push( new THREE.Vector3(pointPos[0], this.radius, pointPos[1]) );
		}
		this.objectTape[objectIndex].geometry.push(new THREE.BufferGeometry().setFromPoints( verticies ));
		this.objectTape[objectIndex].materials.push( new THREE.LineBasicMaterial({color: 0xffffff}) );
		this.objectTape[objectIndex].materials[0].transparent = true;
		this.objectTape[objectIndex].materials[0].opacity = 0;
		this.objectTape[objectIndex].objects.push( new THREE.Line(this.objectTape[objectIndex].geometry[0], this.objectTape[objectIndex].materials[0]) );
		this.objectTape[objectIndex].objects[0].layers.enable( 1 );
		localGroup.add( this.objectTape[objectIndex].objects[0] );
		objectIndex++;
		//insert hidden bottom exploder
		this.objectTape.push( new animationObject() );
		this.objectTape[objectIndex].dimensions = [0,0];
		this.objectTape[objectIndex].radius = this.maxExplosiveRadius;
		this.objectTape[objectIndex].motionIncrements = [0,0,0];
		verticies = new Array();
		for(subPointCounter=0; subPointCounter<this.exploderFitness; subPointCounter++)
		{
			pointPos = this.pixelMap.getElipticalPointsRaw(0,0,this.objectTape[objectIndex].dimensions[0],this.objectTape[objectIndex].dimensions[1], (360/this.exploderFitness)*subPointCounter);
			verticies.push( new THREE.Vector3(pointPos[0], -this.radius, pointPos[1]) );
		}
		this.objectTape[objectIndex].geometry.push(new THREE.BufferGeometry().setFromPoints( verticies ));
		this.objectTape[objectIndex].materials.push( new THREE.LineBasicMaterial({color: 0xffffff}) );
		this.objectTape[objectIndex].materials[0].transparent = true;
		this.objectTape[objectIndex].materials[0].opacity = 0;
		this.objectTape[objectIndex].objects.push( new THREE.Line(this.objectTape[objectIndex].geometry[0], this.objectTape[objectIndex].materials[0]) );
		this.objectTape[objectIndex].objects[0].layers.enable( 1 );
		localGroup.add( this.objectTape[objectIndex].objects[0] );
		
		//finalize objects
		this.globalGroupArray.push( localGroup );
		this.globalObjectGroup.add( localGroup );
		this.globalObjectGroup.position.x =  this.origin[0];
		this.globalObjectGroup.position.y =  this.origin[1];
		this.globalObjectGroup.position.z =  this.origin[2];
		if(this.multiObject==0)
		{
			this.scene.add( this.globalObjectGroup );
		}
		this.setUpStatus = 1;
		this.objectIDIndex++;
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
	orbitCreationLoop = function()
	{
		if(this.setUpStatus==0)
		{
			this.insertObject();
		}
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
export default threePingPongParticles;