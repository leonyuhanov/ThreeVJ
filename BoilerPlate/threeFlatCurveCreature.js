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

class threeFlatCurveCreature
{	
	constructor()
	{
		//Main object stores
		this.objectTape = new Array();
		this.globalGroupArray = new Array();
		this.globalObjectGroup = new THREE.Object3D();
		this.groupName = "FCC_";
		this.objectIDIndex = 0;
		this.genObject = new animationObject();
		
		//Global Three Objects form main System
		this.scene;
		
		//Main properties
		this.origin = [0,0,0];
		this.dimensions = [100,100,100];
		this.segments = 8;
		this.pollyFitness = 100;
		this.lineThickness = 1;
		this.rightSplineCurvePoints = new Array();
		this.leftSplineCurvePoints = new Array();
		this.lfoSeed = 0;
		this.opacity = 1;
		this.bloomEnable = 1;
		this.bloomEvery = 3;
		this.rotations = [0,0,0];
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
		var widthPart = this.dimensions[0]/4;
		this.scene = scene;
		this.colourIndex = colourIndex;
		//create LFO for centre line
		this.lfo.addWithTimeCode("centreLineLFO", [ this.dimensions[2] ], [this.dimensions[1]/10], 0, this.lfoSeed);
		//create LFO for right spline lines
		this.lfo.addWithTimeCode("rightLineLFO", [ 100 ], [10], 0, this.lfoSeed);
		//create LFO for left spline lines
		this.lfo.addWithTimeCode("leftLineLFO", [ 100 ], [10], 0, this.lfoSeed);
		//width control lfo
		this.lfo.addWithTimeCode("splineWidthLFO", [ 100 ], [100], 0, this.lfoSeed);
		//depth control lfo for splines
		this.lfo.addWithTimeCode("splineDepthLFO", [ 100 ], [5], 0, this.lfoSeed);
		//Line Thickness control
		this.lfo.addWithTimeCode("lineWidthLFO", [ 100 ], [50], 0, this.lfoSeed);
		
		//set up right spline points
		this.rightSplineCurvePoints.push(new curvePoint(widthPart,80,80,100));
		this.rightSplineCurvePoints.push(new curvePoint(widthPart*2,80,80,100));
		this.rightSplineCurvePoints.push(new curvePoint(widthPart*3,80,80,100));
		this.rightSplineCurvePoints.push(new curvePoint(widthPart*4,80,80,100));
		this.rightSplineCurvePoints.push(new curvePoint(widthPart*5,70,70,110));
		//set up right spline points
		this.leftSplineCurvePoints.push(new curvePoint(widthPart,260,260,270));
		this.leftSplineCurvePoints.push(new curvePoint(widthPart*2,260,260,270));
		this.leftSplineCurvePoints.push(new curvePoint(widthPart*3,260,260,270));
		this.leftSplineCurvePoints.push(new curvePoint(widthPart*4,260,260,270));
		this.leftSplineCurvePoints.push(new curvePoint(widthPart*5,250,250,280));
	}
	animate = function(colourControls, controlData, rotationalIncrements=[0,0,0])
	{
		//controlData[0]  object scale
		//controlData[1]  width scale
		//controlData[2]  height scale
		//controlData[3]  depth scale
		//controlData[4]  vertex rotation scaler
		//controlData[5]  line width scale
		//controlData[6]  centre linw lfo
		//controlData[7]  centre line speed
		//controlData[8]  spline line lfo
		//controlData[9]  spline line lfo speed
		//controlData[10]  width lfo
		//controlData[11]  width lfo speed
		//controlData[12]  depth lfo
		//controlData[13]  depth lfo speed
		//controlData[14]  Mininum width from centre point line

		
		if(this.setUpStatus==0){return;}
		
		var objectIndex=0, partIndex=0, vertIndex=0, splineCounter=0;
		var vertecies = new Array(), centreLineVertecies, splineVertecies, tempCurve, vertArray, splineVertecites;
		var localGroup = new THREE.Object3D();
		var localTimeCode = 0, localZPoint = 0, localYPoint = 0, localWidth=0;
		var centreLineTimeCode = this.lfo.getTimeCode("centreLineLFO");
		var RSLFOTimeCode = this.lfo.getTimeCode("rightLineLFO"), LSLFOTimeCode = this.lfo.getTimeCode("leftLineLFO"), widthLFOTimeCode = this.lfo.getTimeCode("splineWidthLFO"), depthLFOTimeCode = this.lfo.getTimeCode("splineDepthLFO");
		var oldTimeCode = centreLineTimeCode, oldRSTimeCode = RSLFOTimeCode, oldLSTimeCode = LSLFOTimeCode, oldDepthLFOTimeCode = depthLFOTimeCode;
		var yRange=0, vertexYPos=0, localAngle = 0;
		var rightOuterPoints = new Array(), leftOuterPoints = new Array();
		var widthLFOIncrement = controlData[10];
		var zMin = -(this.screenRange[2]/2), zIndex=0;
		var minWidth = this.dimensions[0]*controlData[14];
		
		
		//---	update centre line	---
		for(vertIndex=0; vertIndex<this.segments; vertIndex++)
		{
			centreLineTimeCode+=controlData[6];
			localTimeCode = (this.dimensions[1]/this.segments)*vertIndex;
			localZPoint = this.lfo.read("centreLineLFO", 0, centreLineTimeCode);
			vertecies.push( new THREE.Vector3(0, (-(this.dimensions[1]/2))+localTimeCode, localZPoint) );
		}
		this.lfo.setTimeCode("centreLineLFO", oldTimeCode+controlData[7]);
		tempCurve = new THREE.CatmullRomCurve3( vertecies );
		centreLineVertecies = tempCurve.getPoints( this.pollyFitness );
		vertArray = new Array();
		for(vertIndex=0; vertIndex<centreLineVertecies.length; vertIndex++)
		{
			vertArray.push(centreLineVertecies[vertIndex].x, centreLineVertecies[vertIndex].y, centreLineVertecies[vertIndex].z)
		}
		this.objectTape[objectIndex].geometry[partIndex].setPositions( vertArray );
		//line width
		this.objectTape[objectIndex].materials[partIndex].linewidth = this.lineThickness*controlData[5];
		objectIndex++;
		
		//---	update right splines	---
		for(splineCounter=0; splineCounter<this.segments; splineCounter++)
		{
			//vertex generator for curve lines
			splineVertecites = new Array();
			for(vertIndex=0; vertIndex<this.rightSplineCurvePoints.length; vertIndex++)
			{
				//step though width lfo
				this.rightSplineCurvePoints[vertIndex].radius = (this.rightSplineCurvePoints[vertIndex].initRadius * (this.lfo.read("splineWidthLFO", 0, (widthLFOIncrement*splineCounter)+widthLFOTimeCode)/100))+minWidth;				
				vertexYPos = vertecies[splineCounter].y;
				RSLFOTimeCode += controlData[8];
				localAngle = this.rightSplineCurvePoints[vertIndex].minAngle + (this.rightSplineCurvePoints[vertIndex].angleRange*(this.lfo.read("rightLineLFO", 0, RSLFOTimeCode)/100));		
				this.rightSplineCurvePoints[vertIndex].setAngle(localAngle);
				//Depth lfo
				zIndex = zMin + ((this.lfo.read("splineDepthLFO", 0, depthLFOTimeCode)/100)*this.screenRange[2]);
				depthLFOTimeCode += controlData[12];
				this.rightSplineCurvePoints[vertIndex].position[2] = zIndex;
				if(vertIndex==0)
				{
					splineVertecites.push( new THREE.Vector3(vertecies[splineCounter].x, vertecies[splineCounter].y, vertecies[splineCounter].z) );
				}
				else
				{
					splineVertecites.push( new THREE.Vector3(this.rightSplineCurvePoints[vertIndex].position[0], this.rightSplineCurvePoints[vertIndex].position[1]+vertexYPos, this.rightSplineCurvePoints[vertIndex].position[2]) );
				}
				//add outer points for right side
				if(vertIndex+1==this.rightSplineCurvePoints.length)
				{
					rightOuterPoints.push(new THREE.Vector3(this.rightSplineCurvePoints[vertIndex].position[0], this.rightSplineCurvePoints[vertIndex].position[1]+vertexYPos, this.rightSplineCurvePoints[vertIndex].position[2]) );
				}
			}
			//reset LFO and increment
			this.lfo.setTimeCode("rightLineLFO", oldRSTimeCode);
			this.lfo.setTimeCode("splineWidthLFO", widthLFOTimeCode)
			depthLFOTimeCode = oldDepthLFOTimeCode;
			
			tempCurve = new THREE.CatmullRomCurve3( splineVertecites );
			splineVertecites = tempCurve.getPoints( this.pollyFitness );
			vertArray = new Array();
			for(vertIndex=0; vertIndex<splineVertecites.length; vertIndex++)
			{
				vertArray.push(splineVertecites[vertIndex].x, splineVertecites[vertIndex].y, splineVertecites[vertIndex].z)
			}
			//Geometries
			this.objectTape[objectIndex].geometry[partIndex].setPositions( vertArray );
			//line width
			this.objectTape[objectIndex].materials[partIndex].linewidth = ((this.lfo.read("lineWidthLFO", (100/this.segments)*splineCounter, 0)/100)*this.lineThickness*controlData[5])+this.lineThickness;		//this.lineThickness*controlData[5];
			//colour
			this.colourObject.getColour( this.subColourIndex%this.colourObject._bandWidth );
			this.objectTape[objectIndex].materials[partIndex].color.r = this.colourObject._currentColour[0]/255;
			this.objectTape[objectIndex].materials[partIndex].color.g = this.colourObject._currentColour[1]/255;
			this.objectTape[objectIndex].materials[partIndex].color.b = this.colourObject._currentColour[2]/255;
			this.subColourIndex += colourControls[1];
			objectIndex++;
		}
		//reset LFO and increment
		this.lfo.setTimeCode("rightLineLFO", oldRSTimeCode+controlData[9]);
		this.lfo.setTimeCode("splineWidthLFO", widthLFOTimeCode);
		//---	update Left splines	---
		this.subColourIndex = this.colourIndex;
		for(splineCounter=0; splineCounter<this.segments; splineCounter++)
		{
			//vertex generator for curve lines
			splineVertecites = new Array();
			for(vertIndex=0; vertIndex<this.leftSplineCurvePoints.length; vertIndex++)
			{
				//step though width lfo
				this.leftSplineCurvePoints[vertIndex].radius = (this.leftSplineCurvePoints[vertIndex].initRadius * (this.lfo.read("splineWidthLFO", 0, (widthLFOIncrement*splineCounter)+widthLFOTimeCode)/100))+minWidth;
				vertexYPos = vertecies[splineCounter].y;
				LSLFOTimeCode += controlData[8];
				localAngle = this.leftSplineCurvePoints[vertIndex].minAngle + (this.leftSplineCurvePoints[vertIndex].angleRange*(this.lfo.read("leftLineLFO", 0, LSLFOTimeCode)/100));		
				this.leftSplineCurvePoints[vertIndex].setAngle(localAngle);
				//Depth lfo
				zIndex = zMin + ((this.lfo.read("splineDepthLFO", 0, depthLFOTimeCode)/100)*this.screenRange[2]);
				depthLFOTimeCode += controlData[12];
				this.leftSplineCurvePoints[vertIndex].position[2] = zIndex;
				if(vertIndex==0)
				{
					splineVertecites.push( new THREE.Vector3(vertecies[splineCounter].x, vertecies[splineCounter].y, vertecies[splineCounter].z) );
				}
				else
				{
					splineVertecites.push( new THREE.Vector3(this.leftSplineCurvePoints[vertIndex].position[0], this.leftSplineCurvePoints[vertIndex].position[1]+vertexYPos, this.leftSplineCurvePoints[vertIndex].position[2]) );
				}
				//add outer points for right side
				if(vertIndex+1==this.leftSplineCurvePoints.length)
				{
					leftOuterPoints.push(new THREE.Vector3(this.leftSplineCurvePoints[vertIndex].position[0], this.leftSplineCurvePoints[vertIndex].position[1]+vertexYPos, this.leftSplineCurvePoints[vertIndex].position[2]) );
				}
			}
			//reset LFO and increment
			this.lfo.setTimeCode("leftLineLFO", oldLSTimeCode);
			this.lfo.setTimeCode("splineWidthLFO", widthLFOTimeCode);
			depthLFOTimeCode = oldDepthLFOTimeCode;
			
			tempCurve = new THREE.CatmullRomCurve3( splineVertecites );
			splineVertecites = tempCurve.getPoints( this.pollyFitness );
			vertArray = new Array();
			for(vertIndex=0; vertIndex<splineVertecites.length; vertIndex++)
			{
				vertArray.push(splineVertecites[vertIndex].x, splineVertecites[vertIndex].y, splineVertecites[vertIndex].z)
			}
			//Geometries
			this.objectTape[objectIndex].geometry[partIndex].setPositions( vertArray );
			//line width
			this.objectTape[objectIndex].materials[partIndex].linewidth = ((this.lfo.read("lineWidthLFO", (100/this.segments)*splineCounter, 0)/100)*this.lineThickness*controlData[5])+this.lineThickness;		//this.lineThickness*controlData[5];
			//colour
			this.colourObject.getColour( this.subColourIndex%this.colourObject._bandWidth );
			this.objectTape[objectIndex].materials[partIndex].color.r = this.colourObject._currentColour[0]/255;
			this.objectTape[objectIndex].materials[partIndex].color.g = this.colourObject._currentColour[1]/255;
			this.objectTape[objectIndex].materials[partIndex].color.b = this.colourObject._currentColour[2]/255;
			this.subColourIndex += colourControls[1];
			objectIndex++;
		}
		//Update Right outer line
		tempCurve = new THREE.CatmullRomCurve3( rightOuterPoints );
		splineVertecites = tempCurve.getPoints( this.pollyFitness );
		vertArray = new Array();
		for(vertIndex=0; vertIndex<splineVertecites.length; vertIndex++)
		{
			vertArray.push(splineVertecites[vertIndex].x, splineVertecites[vertIndex].y, splineVertecites[vertIndex].z)
		}
		//Geometries
		this.objectTape[objectIndex].geometry[partIndex].setPositions( vertArray );
		//line width
		this.objectTape[objectIndex].materials[partIndex].linewidth = this.lineThickness*controlData[5];
		objectIndex++;
		//Update LEFT outer line
		tempCurve = new THREE.CatmullRomCurve3( leftOuterPoints );
		splineVertecites = tempCurve.getPoints( this.pollyFitness );
		vertArray = new Array();
		for(vertIndex=0; vertIndex<splineVertecites.length; vertIndex++)
		{
			vertArray.push(splineVertecites[vertIndex].x, splineVertecites[vertIndex].y, splineVertecites[vertIndex].z)
		}
		//Geometries
		this.objectTape[objectIndex].geometry[partIndex].setPositions( vertArray );
		//line width
		this.objectTape[objectIndex].materials[partIndex].linewidth = this.lineThickness*controlData[5];
		objectIndex++;
		
		
		//reset LFO and increment
		this.lfo.setTimeCode("leftLineLFO", oldLSTimeCode+controlData[9]);
		this.lfo.setTimeCode("splineWidthLFO", widthLFOTimeCode+controlData[11]);
		this.lfo.setTimeCode("splineDepthLFO", oldDepthLFOTimeCode+controlData[13]);
		//global rotation		
		this.globalObjectGroup.rotateX( this.angleToRadian(rotationalIncrements[0]) );
		this.globalObjectGroup.rotateY( this.angleToRadian(rotationalIncrements[1]) );
		this.globalObjectGroup.rotateZ( this.angleToRadian(rotationalIncrements[2]) );

		this.colourIndex += colourControls[0];
		this.subColourIndex = this.colourIndex;
	}
	insertObject = function()
	{
		var objectIndex=0, partIndex=0, vertIndex=0, splineCounter=0;
		var vertecies = new Array(), centreLineVertecies, tempCurve, vertArray;
		var splineVertecites = new Array(), rightOuterPoints = new Array(), leftOuterPoints = new Array();
		var localGroup = new THREE.Object3D();
		var localTimeCode = 0, localZPoint = 0, vertexYPos=0;
		
		this.subColourIndex = this.colourIndex;
		//create the centre line
		for(vertIndex=0; vertIndex<this.segments; vertIndex++)
		{
			localTimeCode = (this.dimensions[1]/this.segments)*vertIndex;
			localZPoint = this.lfo.read("centreLineLFO", 0, localTimeCode);
			vertecies.push( new THREE.Vector3(0, localTimeCode, localZPoint) );
		}
		//reset LFO for centre line
		this.lfo.setTimeCode("centreLineLFO", 0);
		tempCurve = new THREE.CatmullRomCurve3( vertecies );
		centreLineVertecies = tempCurve.getPoints( this.pollyFitness );
		vertArray = new Array();
		for(vertIndex=0; vertIndex<centreLineVertecies.length; vertIndex++)
		{
			vertArray.push(centreLineVertecies[vertIndex].x, centreLineVertecies[vertIndex].y, centreLineVertecies[vertIndex].z)
		}
		this.objectTape.push( new animationObject() );
		this.objectTape[objectIndex].objectID = this.groupName+this.objectIDIndex;
		//Geometries
		this.objectTape[objectIndex].geometry.push(  new LineGeometry() );
		this.objectTape[objectIndex].geometry[partIndex].setPositions( vertArray );
		//Material
		this.objectTape[objectIndex].materials.push( new LineMaterial( {color: 0xffffff, linewidth: this.lineThickness, worldUnits: true, vertexColors: false, alphaToCoverage: false} ) );
		this.objectTape[objectIndex].materials[partIndex].transparent = true;
		this.objectTape[objectIndex].materials[partIndex].opacity = this.opacity;
		//colour
		this.colourObject.getColour( this.subColourIndex%this.colourObject._bandWidth );
		this.objectTape[objectIndex].materials[partIndex].color.r = this.colourObject._currentColour[0]/255;
		this.objectTape[objectIndex].materials[partIndex].color.g = this.colourObject._currentColour[1]/255;
		this.objectTape[objectIndex].materials[partIndex].color.b = this.colourObject._currentColour[2]/255;
		//Object
		this.objectTape[objectIndex].objects.push( new Line2(this.objectTape[objectIndex].geometry[partIndex], this.objectTape[objectIndex].materials[partIndex]) );
		if(this.bloomEnable==1)
		{
			this.objectTape[objectIndex].objects[partIndex].layers.enable( 1 );
		}
		//add to local group
		localGroup.add( this.objectTape[objectIndex].objects[partIndex] );
		this.objectIDIndex++;
		this.subColourIndex += this.creationColourIncrement;
		objectIndex++;		
		//insert right splines
		for(splineCounter=0; splineCounter<this.segments; splineCounter++)
		{
			this.objectTape.push( new animationObject() );
			this.objectTape[objectIndex].objectID = this.groupName+this.objectIDIndex;
			//vertex generator for curve lines
			splineVertecites = new Array();
			for(vertIndex=0; vertIndex<this.rightSplineCurvePoints.length; vertIndex++)
			{
				vertexYPos = vertecies[splineCounter].y;
				if(vertIndex==0)
				{
					splineVertecites.push( new THREE.Vector3(vertecies[splineCounter].x, vertecies[splineCounter].y, vertecies[splineCounter].z) );
				}
				else
				{
					splineVertecites.push( new THREE.Vector3(this.rightSplineCurvePoints[vertIndex].position[0], this.rightSplineCurvePoints[vertIndex].position[1]+vertexYPos, this.rightSplineCurvePoints[vertIndex].position[2]) );
				}
				//add outer points for right side
				if(vertIndex+1==this.rightSplineCurvePoints.length)
				{
					rightOuterPoints.push(new THREE.Vector3(this.rightSplineCurvePoints[vertIndex].position[0], this.rightSplineCurvePoints[vertIndex].position[1]+vertexYPos, this.rightSplineCurvePoints[vertIndex].position[2]) );
				}
			}
			tempCurve = new THREE.CatmullRomCurve3( splineVertecites );
			splineVertecites = tempCurve.getPoints( this.pollyFitness );
			vertArray = new Array();
			for(vertIndex=0; vertIndex<splineVertecites.length; vertIndex++)
			{
				vertArray.push(splineVertecites[vertIndex].x, splineVertecites[vertIndex].y, splineVertecites[vertIndex].z)
			}
			//Geometries
			this.objectTape[objectIndex].geometry.push(  new LineGeometry() );
			this.objectTape[objectIndex].geometry[partIndex].setPositions( vertArray );
			//Material
			this.objectTape[objectIndex].materials.push( new LineMaterial( {color: 0xffffff, linewidth: this.lineThickness, worldUnits: true, vertexColors: false, alphaToCoverage: false} ) );
			this.objectTape[objectIndex].materials[partIndex].transparent = true;
			this.objectTape[objectIndex].materials[partIndex].opacity = this.opacity;
			//colour
			this.colourObject.getColour( this.subColourIndex%this.colourObject._bandWidth );
			this.objectTape[objectIndex].materials[partIndex].color.r = this.colourObject._currentColour[0]/255;
			this.objectTape[objectIndex].materials[partIndex].color.g = this.colourObject._currentColour[1]/255;
			this.objectTape[objectIndex].materials[partIndex].color.b = this.colourObject._currentColour[2]/255;
			//Object
			this.objectTape[objectIndex].objects.push( new Line2(this.objectTape[objectIndex].geometry[partIndex], this.objectTape[objectIndex].materials[partIndex]) );
			//bloom
			if(this.bloomEnable==1)
			{
				if(objectIndex%this.bloomEvery == this.bloomEvery-1)
				{
					this.objectTape[objectIndex].objects[partIndex].layers.enable( 1 );
				}
			}
			//add to local group
			localGroup.add( this.objectTape[objectIndex].objects[partIndex] );
			objectIndex++;
		}
		//insert left splines
		for(splineCounter=0; splineCounter<this.segments; splineCounter++)
		{
			this.objectTape.push( new animationObject() );
			this.objectTape[objectIndex].objectID = this.groupName+this.objectIDIndex;
			//vertex generator for curve lines
			splineVertecites = new Array();
			for(vertIndex=0; vertIndex<this.leftSplineCurvePoints.length; vertIndex++)
			{
				vertexYPos = vertecies[splineCounter].y;
				if(vertIndex==0)
				{
					splineVertecites.push( new THREE.Vector3(vertecies[splineCounter].x, vertecies[splineCounter].y, vertecies[splineCounter].z) );
				}
				else
				{
					splineVertecites.push( new THREE.Vector3(this.leftSplineCurvePoints[vertIndex].position[0], this.leftSplineCurvePoints[vertIndex].position[1]+vertexYPos, this.leftSplineCurvePoints[vertIndex].position[2]) );
				}
				//add outer points for right side
				if(vertIndex+1==this.leftSplineCurvePoints.length)
				{
					leftOuterPoints.push(new THREE.Vector3(this.leftSplineCurvePoints[vertIndex].position[0], this.leftSplineCurvePoints[vertIndex].position[1]+vertexYPos, this.leftSplineCurvePoints[vertIndex].position[2]) );
				}
			}
			tempCurve = new THREE.CatmullRomCurve3( splineVertecites );
			splineVertecites = tempCurve.getPoints( this.pollyFitness );
			vertArray = new Array();
			for(vertIndex=0; vertIndex<splineVertecites.length; vertIndex++)
			{
				vertArray.push(splineVertecites[vertIndex].x, splineVertecites[vertIndex].y, splineVertecites[vertIndex].z)
			}
			//Geometries
			this.objectTape[objectIndex].geometry.push(  new LineGeometry() );
			this.objectTape[objectIndex].geometry[partIndex].setPositions( vertArray );
			//Material
			this.objectTape[objectIndex].materials.push( new LineMaterial( {color: 0xffffff, linewidth: this.lineThickness, worldUnits: true, vertexColors: false, alphaToCoverage: false} ) );
			this.objectTape[objectIndex].materials[partIndex].transparent = true;
			this.objectTape[objectIndex].materials[partIndex].opacity = this.opacity;
			//colour
			this.colourObject.getColour( this.subColourIndex%this.colourObject._bandWidth );
			this.objectTape[objectIndex].materials[partIndex].color.r = this.colourObject._currentColour[0]/255;
			this.objectTape[objectIndex].materials[partIndex].color.g = this.colourObject._currentColour[1]/255;
			this.objectTape[objectIndex].materials[partIndex].color.b = this.colourObject._currentColour[2]/255;
			//Object
			this.objectTape[objectIndex].objects.push( new Line2(this.objectTape[objectIndex].geometry[partIndex], this.objectTape[objectIndex].materials[partIndex]) );
			//bloom
			if(this.bloomEnable==1)
			{
				if(objectIndex%this.bloomEvery == this.bloomEvery-1)
				{
					this.objectTape[objectIndex].objects[partIndex].layers.enable( 1 );
				}
			}
			//add to local group
			localGroup.add( this.objectTape[objectIndex].objects[partIndex] );
			
			objectIndex++;
		}
		//Insert the RIGHT outer line
		this.objectTape.push( new animationObject() );
		this.objectTape[objectIndex].objectID = this.groupName+this.objectIDIndex;
		tempCurve = new THREE.CatmullRomCurve3( rightOuterPoints );
		splineVertecites = tempCurve.getPoints( this.pollyFitness );
		vertArray = new Array();
		for(vertIndex=0; vertIndex<splineVertecites.length; vertIndex++)
		{
			vertArray.push(splineVertecites[vertIndex].x, splineVertecites[vertIndex].y, splineVertecites[vertIndex].z)
		}
		//Geometries
		this.objectTape[objectIndex].geometry.push(  new LineGeometry() );
		this.objectTape[objectIndex].geometry[partIndex].setPositions( vertArray );
		//Material
		this.objectTape[objectIndex].materials.push( new LineMaterial( {color: 0xffffff, linewidth: this.lineThickness, worldUnits: true, vertexColors: false, alphaToCoverage: false} ) );
		this.objectTape[objectIndex].materials[partIndex].transparent = true;
		this.objectTape[objectIndex].materials[partIndex].opacity = this.opacity;
		//colour
		this.colourObject.getColour( this.subColourIndex%this.colourObject._bandWidth );
		this.objectTape[objectIndex].materials[partIndex].color.r = this.colourObject._currentColour[0]/255;
		this.objectTape[objectIndex].materials[partIndex].color.g = this.colourObject._currentColour[1]/255;
		this.objectTape[objectIndex].materials[partIndex].color.b = this.colourObject._currentColour[2]/255;
		//Object
		this.objectTape[objectIndex].objects.push( new Line2(this.objectTape[objectIndex].geometry[partIndex], this.objectTape[objectIndex].materials[partIndex]) );
		if(this.bloomEnable==1)
		{
			this.objectTape[objectIndex].objects[partIndex].layers.enable( 1 );
		}
		//add to local group
		localGroup.add( this.objectTape[objectIndex].objects[partIndex] );
		objectIndex++;
		//Insert the LEFT outer line
		this.objectTape.push( new animationObject() );
		this.objectTape[objectIndex].objectID = this.groupName+this.objectIDIndex;
		tempCurve = new THREE.CatmullRomCurve3( leftOuterPoints );
		splineVertecites = tempCurve.getPoints( this.pollyFitness );
		vertArray = new Array();
		for(vertIndex=0; vertIndex<splineVertecites.length; vertIndex++)
		{
			vertArray.push(splineVertecites[vertIndex].x, splineVertecites[vertIndex].y, splineVertecites[vertIndex].z)
		}
		//Geometries
		this.objectTape[objectIndex].geometry.push(  new LineGeometry() );
		this.objectTape[objectIndex].geometry[partIndex].setPositions( vertArray );
		//Material
		this.objectTape[objectIndex].materials.push( new LineMaterial( {color: 0xffffff, linewidth: this.lineThickness, worldUnits: true, vertexColors: false, alphaToCoverage: false} ) );
		this.objectTape[objectIndex].materials[partIndex].transparent = true;
		this.objectTape[objectIndex].materials[partIndex].opacity = this.opacity;
		//colour
		this.colourObject.getColour( this.subColourIndex%this.colourObject._bandWidth );
		this.objectTape[objectIndex].materials[partIndex].color.r = this.colourObject._currentColour[0]/255;
		this.objectTape[objectIndex].materials[partIndex].color.g = this.colourObject._currentColour[1]/255;
		this.objectTape[objectIndex].materials[partIndex].color.b = this.colourObject._currentColour[2]/255;
		//Object
		this.objectTape[objectIndex].objects.push( new Line2(this.objectTape[objectIndex].geometry[partIndex], this.objectTape[objectIndex].materials[partIndex]) );
		if(this.bloomEnable==1)
		{
			this.objectTape[objectIndex].objects[partIndex].layers.enable( 1 );
		}
		//add to local group
		localGroup.add( this.objectTape[objectIndex].objects[partIndex] );
		objectIndex++;
			
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
export default threeFlatCurveCreature;