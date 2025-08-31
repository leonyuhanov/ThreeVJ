//Note ON events are  0[144+MIDI CHANEL-1] 1[KEY ID] 2[VELOCITY]
//Note OFF events are 0[128+MIDI CHANEL-1] 1[KEY ID] 2[VELOCITY] 
/*
Colour values for Launch Controll XL Rotaries + Buttons
Hex		Decimal 	Colour 		Brightness
0Ch 	12 			Off 		Off
0Dh 	13 			Red 		Low
0Fh 	15 			Red 		Full
1Dh 	29 			Amber 		Low
3Fh 	63 			Amber 		Full
3Eh 	62 			Yellow 		Full
1Ch 	28 			Green 		Low
3Ch 	60 			Green 		Full
Flashing
Hex 	Decimal 	Colour 		Brightness
0Bh 	11 			Red 		Full
3Bh 	59 			Amber 		Full
3Ah 	58 			Yellow 		Full
38h 	56 			Green 		Full
*/
class MIDIMapper
{	
	constructor()
	{
		this.midiMapArray = new Array();
		this.noteStack = new Array();
		this.numberOfItems=0;
		this.innerCounter=0;
		this.lastKeyHit=0;
		this.lastKeyReleased=0;
		this.midiKeyRange = [48,84];
		this.midiNoteArray = [[21,'A',0],[22,'A#',0],[23,'B',0],[24,'C',1],[25,'C#',1],[26,'D',1],[27,'D#',1],[28,'E',1],[29,'F',1],[30,'F#',1],[31,'G',1],[32,'G#',1],[33,'A',1],[34,'A#',1],[35,'B',1],[36,'C',2],[37,'C#',2],[38,'D',2],[39,'D#',2],[40,'E',2],[41,'F',2],[42,'F#',2],[43,'G',2],[44,'G#',2],[45,'A',2],[46,'A#',2],[47,'B',2],[48,'C',3],[49,'C#',3],[50,'D',3],[51,'D#',3],[52,'E',3],[53,'F',3],[54,'F#',3],[55,'G',3],[56,'G#',3],[57,'A',3],[58,'A#',3],[59,'B',3],[60,'C',4],[61,'C#',4],[62,'D',4],[63,'D#',4],[64,'E',4],[65,'F',4],[66,'F#',4],[67,'G',4],[68,'G#',4],[69,'A',4],[70,'A#',4],[71,'B',4],[72,'C',5],[73,'C#',5],[74,'D',5],[75,'D#',5],[76,'E',5],[77,'F',5],[78,'F#',5],[79,'G',5],[80,'G#',5],[81,'A',5],[82,'A#',5],[83,'B',5],[84,'C',6],[85,'C#',6],[86,'D',6],[87,'D#',6],[88,'E',6],[89,'F',6],[90,'F#',6],[91,'G',6],[92,'G#',6],[93,'A',6],[94,'A#',6],[95,'B',6],[96,'C',7],[97,'C#',7],[98,'D',7],[99,'D#',7],[100,'E',7],[101,'F',7],[102,'F#',7],[103,'G',7],[104,'G#',7],[105,'A',7],[106,'A#',7],[107,'B',7],[108,'C',8]];
		this.chordOffests = [[0,4,9,12],[0,5,9,12]];
		this.colourIndex = [ ['red', 15], ['amber', 63], ['yellow', 62], ['green', 60], ['redflash', 11], ['amberflash', 59], ['yellowflash', 58], ['greenflash', 56] ]; 
		this.defaultColour = 'green';
		this.keyCounter = 0;
		
		//custom lighting & control for the Novation Launchpad x
		this.allAnimationList = new Array();
		this.animationBookmarks = new Array();
		this.padAddressList = new Array();
		this.colourList = new Array();
		this.lightTypeList = new Array();
		this.defaultAnimationColour = 5;
		this.defaultBookMarkColour = 37;
		this.wsHUD;
		this.webSocketConnected=0;
	}
	addItem =  function(MIDIChan, CCID, controlName, scaleToValue, scaleFromValue=0, defaultColour=this.defaultColour)
	{
		this.midiMapArray.push([MIDIChan, CCID, controlName, 0, 0, scaleToValue, new Array(), 0, 0, scaleFromValue, null, [], defaultColour])
		this.numberOfItems = this.midiMapArray.length;
	}
	addItem =  function(MIDIChan, CCID, controlName, scaleToValue, initialValue, scaleFromValue=0, defaultColour=this.defaultColour)
	{
		this.midiMapArray.push([MIDIChan, CCID, controlName, 0, 0, scaleToValue, new Array(), 0, 0, scaleFromValue, null, [], defaultColour])
		this.numberOfItems = this.midiMapArray.length;
		this.setValue(controlName, initialValue);
		this.setChangedState(controlName, 0);
	}
	addItemKEY =  function(MIDIChan, CCID, controlName, scaleToValue, initialValue, defaultColour=this.defaultColour)
	{
		this.midiMapArray.push([MIDIChan, CCID, controlName, 0, 0, scaleToValue, new Array(), 0, 1, 0, null, [], defaultColour])
		this.numberOfItems = this.midiMapArray.length;
		this.setValue(controlName, initialValue);
		this.setChangedState(controlName, 0);
	}
	addItem_callBack =  function(MIDIChan, CCID, controlName, scaleToValue, initialValue, callBackFunction, callBackArgs, scaleFromValue=0, defaultColour=this.defaultColour)
	{
		this.midiMapArray.push([MIDIChan, CCID, controlName, 0, 0, scaleToValue, new Array(), 0, 0, scaleFromValue, new callBackFuncWrapper(callBackFunction), callBackArgs, defaultColour])
		this.numberOfItems = this.midiMapArray.length;
		this.setValue(controlName, initialValue);
		this.setChangedState(controlName, 0);
	}
	changeColour = function(controlName, colour)
	{
		if(this.findColour(colour)!=-1)
		{
			for(this.innerCounter=0; this.innerCounter<this.numberOfItems; this.innerCounter++)
			{
				if(this.midiMapArray[this.innerCounter][2]==controlName)
				{
					this.midiMapArray[this.innerCounter][12] = colour;
				}
			}
		}
	}
	deleteItem = function(controlName)
	{
		for(this.innerCounter=0; this.innerCounter<this.numberOfItems; this.innerCounter++)
		{
			if(this.midiMapArray[this.innerCounter][2]==controlName)
			{
				this.midiMapArray.splice(this.innerCounter, 1);
				this.numberOfItems--;
				return;
			}
		}
	}
	changeScaleToValue = function(controlName, scaleToValue, scaleFromValue=0)
	{
		for(this.innerCounter=0; this.innerCounter<this.numberOfItems; this.innerCounter++)
		{
			if(this.midiMapArray[this.innerCounter][2]==controlName)
			{
				this.midiMapArray[this.innerCounter][5] = scaleToValue;
				this.midiMapArray[this.innerCounter][9] = scaleFromValue;
			}
		}
	}
	scaleTo = function(value, scaleTo)
	{
		return (value/127)*scaleTo;
	}
	onMidiEvent = function(midiData)
	{
		//Handle Midi Keys
		//this.handleKeys(midiData.data[0], midiData.data[1], midiData.data[2]);
		if(this.handleKeysAsControls(midiData.data[0], midiData.data[1], midiData.data[2])==1)
		{
			return;
		}
		//Handle all other stored controlls
		for(this.innerCounter=0; this.innerCounter<this.numberOfItems; this.innerCounter++)
		{
			if(midiData.data[0] == this.midiMapArray[this.innerCounter][0] && midiData.data[1] == this.midiMapArray[this.innerCounter][1])
			{
				//Actual midi value 0-127
				this.midiMapArray[this.innerCounter][3] = midiData.data[2];
				//scaled value for application use
				this.midiMapArray[this.innerCounter][4] = this.scaleTo( midiData.data[2], this.midiMapArray[this.innerCounter][5]-this.midiMapArray[this.innerCounter][9] ) + this.midiMapArray[this.innerCounter][9];
				this.midiMapArray[this.innerCounter][7] = 1;
				//Update HUD via ws
				if(midiData.data[1]<=48)
				{
					this.updateHud(midiData.data[1], midiData.data[2]/127);
				}
				return;
			}
		}
	}
	hasChanged = function(controlName)
	{
		var cCounter=0;
		for(cCounter=0; cCounter<this.numberOfItems; cCounter++)
		{
			if(this.midiMapArray[cCounter][2]==controlName)
			{
				if(this.midiMapArray[cCounter][7]==1)
				{
					return 1;
				}
				else
				{
					return 0;
				}
			}
		}
	}
	setChanged = function(controlName)
	{
		for(this.innerCounter=0; this.innerCounter<this.numberOfItems; this.innerCounter++)
		{
			if(this.midiMapArray[this.innerCounter][2]==controlName)
			{
				this.midiMapArray[this.innerCounter][7]=1;
			}
		}
	}
	setChangedState = function(controlName, state)
	{
		for(this.innerCounter=0; this.innerCounter<this.numberOfItems; this.innerCounter++)
		{
			if(this.midiMapArray[this.innerCounter][2]==controlName)
			{
				this.midiMapArray[this.innerCounter][7]=state;
			}
		}
	}
	setMultiValues = function(controlName, valueArray)
	{
		for(this.innerCounter=0; this.innerCounter<this.numberOfItems; this.innerCounter++)
		{
			if(this.midiMapArray[this.innerCounter][2]==controlName)
			{
				this.midiMapArray[this.innerCounter][6] = valueArray;
				//set flag indicating value has changed
				this.midiMapArray[this.innerCounter][7] = 1;
			}
		}
	}
	setValue = function(controlName, value)
	{
		for(this.innerCounter=0; this.innerCounter<this.numberOfItems; this.innerCounter++)
		{
			if(this.midiMapArray[this.innerCounter][2]==controlName)
			{
				//Scaled value used by the application
				this.midiMapArray[this.innerCounter][4] = value;
				//Midi value 0-127 from the above scaled value
				this.midiMapArray[this.innerCounter][3] = value*127;
				this.midiMapArray[this.innerCounter][7] = 1;
				return;
			}
		}
	}
	setMidiValue = function(controlName, value)
	{
		for(this.innerCounter=0; this.innerCounter<this.numberOfItems; this.innerCounter++)
		{
			if(this.midiMapArray[this.innerCounter][2]==controlName)
			{
				this.midiMapArray[this.innerCounter][3] = value;
				this.midiMapArray[this.innerCounter][4] = this.scaleTo( value, this.midiMapArray[this.innerCounter][5] );
				this.midiMapArray[this.innerCounter][7] = 1;
				return;
			}
		}
	}
	getCallBack = function(controlName)
	{
		for(this.innerCounter=0; this.innerCounter<this.numberOfItems; this.innerCounter++)
		{
			if(this.midiMapArray[this.innerCounter][2]==controlName)
			{
				return [this.midiMapArray[this.innerCounter][10], this.midiMapArray[this.innerCounter][11]];
			}
		}
	}
	getValue = function(controlName)
	{
		for(this.innerCounter=0; this.innerCounter<this.numberOfItems; this.innerCounter++)
		{
			if(this.midiMapArray[this.innerCounter][2]==controlName)
			{
				this.midiMapArray[this.innerCounter][7] = 0;
				return this.midiMapArray[this.innerCounter][4];
			}
		}
	}
	checkValue = function(controlName)
	{
		for(this.innerCounter=0; this.innerCounter<this.numberOfItems; this.innerCounter++)
		{
			if(this.midiMapArray[this.innerCounter][2]==controlName)
			{
				return this.midiMapArray[this.innerCounter][4];
			}
		}
	}
	getValueFromCCID = function(CCID, changeFlag=0)
	{
		for(this.innerCounter=0; this.innerCounter<this.numberOfItems; this.innerCounter++)
		{
			if(this.midiMapArray[this.innerCounter][1]==CCID)
			{
				//this.midiMapArray[this.innerCounter][7] = changeFlag;
				return this.midiMapArray[this.innerCounter][4];
			}
		}
		return null;
	}
	getValueFromCCID = function(MIDIChanel, CCID, changeFlag=0)
	{
		for(this.innerCounter=0; this.innerCounter<this.numberOfItems; this.innerCounter++)
		{
			if(this.midiMapArray[this.innerCounter][0]==MIDIChanel && this.midiMapArray[this.innerCounter][1]==CCID)
			{
				//this.midiMapArray[this.innerCounter][7] = changeFlag;
				return this.midiMapArray[this.innerCounter][4];
			}
		}
		return null;
	}
	getNameFromCCID = function(CCID)
	{
		for(this.innerCounter=0; this.innerCounter<this.numberOfItems; this.innerCounter++)
		{
			if(this.midiMapArray[this.innerCounter][1]==CCID)
			{
				return this.midiMapArray[this.innerCounter][2];
			}
		}
		return -1;
	}
	getNameFromCCID = function(MIDIChanel, CCID)
	{
		for(this.innerCounter=0; this.innerCounter<this.numberOfItems; this.innerCounter++)
		{
			if(this.midiMapArray[this.innerCounter][0]==MIDIChanel && this.midiMapArray[this.innerCounter][1]==CCID)
			{
				return this.midiMapArray[this.innerCounter][2];
			}
		}
		return -1;
	}
	getValueArray = function(controlName)
	{
		for(this.innerCounter=0; this.innerCounter<this.numberOfItems; this.innerCounter++)
		{
			if(this.midiMapArray[this.innerCounter][2]==controlName)
			{
				this.midiMapArray[this.innerCounter][7] = 0;
				return this.midiMapArray[this.innerCounter][6];
			}
		}
	}
	getValueRounded = function(controlName)
	{
		for(this.innerCounter=0; this.innerCounter<this.numberOfItems; this.innerCounter++)
		{
			if(this.midiMapArray[this.innerCounter][2]==controlName)
			{
				this.midiMapArray[this.innerCounter][7] = 0;
				return Math.round(this.midiMapArray[this.innerCounter][4]);
			}
		}
	}
	getScaleToValue = function(controlName)
	{
		for(this.innerCounter=0; this.innerCounter<this.numberOfItems; this.innerCounter++)
		{
			if(this.midiMapArray[this.innerCounter][2]==controlName)
			{
				this.midiMapArray[this.innerCounter][7] = 0;
				return this.midiMapArray[this.innerCounter][5];
			}
		}
	}
	findControlIndex = function(midiID, ccID)
	{
		for(this.innerCounter=0; this.innerCounter<this.numberOfItems; this.innerCounter++)
		{
			if(this.midiMapArray[this.innerCounter][0]==midiID && this.midiMapArray[this.innerCounter][1]==ccID)
			{
				return this.innerCounter;
			}
		}
		return -1;
	}
	findControlKeyIndex = function(ccID)
	{
		for(this.innerCounter=0; this.innerCounter<this.numberOfItems; this.innerCounter++)
		{
			if(this.midiMapArray[this.innerCounter][1]==ccID && this.midiMapArray[this.innerCounter][8]==1)
			{
				return this.innerCounter;
			}
		}
		return -1;
	}
	/*
	handleKeys = function(midiID, ccID, velocity)
	{
		if(ccID>=this.midiKeyRange[0] && ccID<=this.midiKeyRange[1])
		{
			if(midiID==144)
			{
				this.lastKeyHit = ccID;
			}
			else if (midiID==128)
			{
				this.lastKeyReleased = ccID;
			}
		}
	}
	*/
	handleKeysAsControls = function(midiID, ccID, velocity)
	{
		if(midiID>=144 && midiID<=159)
		{
			//NOTE ON
			this.innerCounter = this.findControlIndex(midiID, ccID);
			if(this.innerCounter!=-1)
			{
				if(velocity>0)
				{
					this.setMidiValue(this.midiMapArray[this.innerCounter][2], 127);
				}
				else
				{
					this.setMidiValue(this.midiMapArray[this.innerCounter][2], 0);
				}
				return 1;
			}
		}
		else if(midiID>=128 && midiID<=143)
		{
			this.innerCounter = this.findControlIndex((midiID-128)+144, ccID);
			if(this.innerCounter!=-1)
			{
				this.setMidiValue(this.midiMapArray[this.innerCounter][2], 0);
				return 1;
			}
		}	
		return -1;
	}
	getNote = function(note, octave)
	{
		for(this.keyCounter=0; this.keyCounter<this.midiNoteArray.length; this.keyCounter++)
		{
			if(this.midiNoteArray[this.keyCounter][1]==note && this.midiNoteArray[this.keyCounter][2]==octave)
			{
				return this.midiNoteArray[this.keyCounter][0];
			}
		}
	}
	timeFromBPM = function(bpm)
	{
		return (60000/bpm);
	}
	getItemColour = function(controlName)
	{
		for(this.innerCounter=0; this.innerCounter<this.numberOfItems; this.innerCounter++)
		{
			if(this.midiMapArray[this.innerCounter][2]==controlName)
			{
				return this.findColour(this.midiMapArray[this.innerCounter][12]);
			}
		}
	}
	findColour = function(colour)
	{
		for(this.innerCounter=0; this.innerCounter<this.colourIndex.length; this.innerCounter++)
		{
			if(this.colourIndex[this.innerCounter][0]==colour)
			{
				return this.colourIndex[this.innerCounter][1];
			}
		}
		return -1;
	}
	sendSysEx = function(midiOutput, padAddressList, colourList, lightTypeList)
	{
		var ledMatrixSysExMessage = [240, 0, 32, 41, 2, 12, 3];
		var terminationByte = 247;
		var padCounter=0, blockCounter=0;
		var pixelBlock;
		
		for(padCounter=0; padCounter<padAddressList.length; padCounter++)
		{
			pixelBlock = new Array();
			//Light up type
			if(lightTypeList[padCounter]=="S")
			{
				//Static Colour
				pixelBlock.push(0);
				pixelBlock.push(padAddressList[padCounter]);
				pixelBlock.push(colourList[padCounter]);
			}
			else if(lightTypeList[padCounter]=="F")
			{
				//Flashing
				pixelBlock.push(1);
				pixelBlock.push(padAddressList[padCounter]);
				pixelBlock.push(colourList[padCounter]);
				pixelBlock.push(colourList[padCounter]+1);
			}
			else if(lightTypeList[padCounter]=="P")
			{
				//Pulsing
				pixelBlock.push(2);
				pixelBlock.push(padAddressList[padCounter]);
				pixelBlock.push(colourList[padCounter]);
			}
			else if(lightTypeList[padCounter]=="RGB")
			{
				//RGB Value
				pixelBlock.push(3);
				pixelBlock.push(padAddressList[padCounter]);
				pixelBlock.push(colourList[padCounter][0]);
				pixelBlock.push(colourList[padCounter][1]);
				pixelBlock.push(colourList[padCounter][2]);
			}
			//assemble this block into the main message
			for(blockCounter=0; blockCounter<pixelBlock.length; blockCounter++)
			{
				ledMatrixSysExMessage.push(pixelBlock[blockCounter]);
			}		
		}
		//terminate sysex message
		ledMatrixSysExMessage.push(terminationByte);
		midiOutput.send(ledMatrixSysExMessage);
	}
	updateHud = function(ccid, value)
	{
		if(this.webSocketConnected==0)
		{
			return;
		}
		this.wsHUD.send("PC:"+ccid+"~"+value);
	}
	updateHudLayout = function()
	{
		if(this.webSocketConnected==0)
		{
			return;
		}
		var wsDataToSend="";
		var controlCounter=0, totalToSend=0, sendCounter=0;
		//	CCID, TYPE, NAME, DEFAULT_VALUE, CURRENT_VALUE, IN_USE
		
		for(controlCounter=0; controlCounter<this.midiMapArray.length; controlCounter++)
		{
			if(this.midiMapArray[controlCounter][0]==176 && this.midiMapArray[controlCounter][1]<=48)
			{
				totalToSend++;
			}
		}
		for(controlCounter=0; controlCounter<this.midiMapArray.length; controlCounter++)
		{
			if(this.midiMapArray[controlCounter][0]==176 && this.midiMapArray[controlCounter][1]<=48)
			{
				wsDataToSend+=this.midiMapArray[controlCounter][1]+"~";
				if(this.midiMapArray[controlCounter][1]<=24)
				{
					wsDataToSend+="R~";
				}
				else if(this.midiMapArray[controlCounter][1]>=25 && this.midiMapArray[controlCounter][1]<=32)
				{
					wsDataToSend+="S~";
				}
				else if(this.midiMapArray[controlCounter][1]>=33 && this.midiMapArray[controlCounter][1]<=40)
				{
					wsDataToSend+="T~";
				}
				else if(this.midiMapArray[controlCounter][1]>=41 &&this.midiMapArray[controlCounter][1]<=48)
				{
					wsDataToSend+="M~";
				}
				wsDataToSend+=this.midiMapArray[controlCounter][2]+"~"+this.midiMapArray[controlCounter][9]+"~"+(this.midiMapArray[controlCounter][3]/127)+"~1";
				if(sendCounter+1<totalToSend)
				{
					wsDataToSend+="|";
				}
				sendCounter++;
			}
		}
		this.wsHUD.send("UIUPDATE:"+wsDataToSend);
	}
}
class callBackFuncWrapper
{
	constructor(callBackF)
	{
		this.callBack = callBackF;
	}
}
export default MIDIMapper;