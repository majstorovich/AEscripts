{
   function myScript(thisObj){
      function myScript_buildUI(thisObj){
         var myPanel = (thisObj instanceof Panel) ? thisObj : new Window("palette", "Dockable Script", undefined, {resizeable:true, closeButton: true});

         res = "group{orientation:'column',\
                        groupOne: Group{orientation:'row',\
                        runScriptButton: Button{text:'Dropdown autopopulate'},\
               },\
               groupTwo: Group{orientation:'row',\
                        resetButton: Button{text:'Reset - eye and op. exp.'},\
               },\
               groupThree: Group{orientation:'row',\
               helpButton: Button{text:'Help / Instructions'},\
               },\
         }";

         myPanel.grp = myPanel.add(res);

         //Defaults
          var x_size = 175;
          var y_size = 34;
         myPanel.grp.groupOne.runScriptButton.size = [x_size,y_size];
         myPanel.grp.groupOne.runScriptButton.onClick = function() {
             runScript();
             }
        myPanel.grp.groupTwo.resetButton.size = [x_size,y_size];
        myPanel.grp.groupTwo.resetButton.onClick = function() {
            reset();
            }
        myPanel.grp.groupThree.helpButton.size = [x_size,y_size];
        myPanel.grp.groupThree.helpButton.onClick = function() {
            help();
            }
    
         
         myPanel.layout.layout(true);

         return myPanel;
      }
   
   
      var myScriptPal = myScript_buildUI(thisObj);

      if (myScriptPal != null && myScriptPal instanceof Window){
         myScriptPal.center();
         myScriptPal.show();
      }

   }
   myScript(this);
}

function runScript() {
   
app.beginUndoGroup("Dropdown script");

// yes, this is stupid. I know :(
// need to add this cause it recognizes things as "text1 43" and "text1 4" as duplicate names.
function addSpaces (str,length){

  var spaces = "                                                                                              ";
  return str.concat(spaces.substr(0,length-str.length));

}

// removes whitespace before and after layer name 
String.prototype.trim = function () {

    return this.replace(/^\s+/,'').replace(/\s+$/,'');

}

function findDuplicatesInArray (current,array,i){

  var duplicate = false;
  i--;
  while (array[i] != undefined)
  {
    if( current.trim() == array[i].trim())
    {
      duplicate = true;
    }
    i--;
  }
  return duplicate;
}

function findLongestWord (array){
  var longest = array[0].length;

  for (var i = 1; i < array.length; i++)
  {
    if (array[i].length > longest)
    {
      longest = array[i].length;
    }
  }

  return longest;
}

var proj = app.project;
var curItem = proj.activeItem;
var selected = curItem.selectedLayers;

var selectedLayersName = [];
var selectedLayersIndex = [];

var longestWord;

var selectedLayerNamesRenamedDuplicates = [];

var checkForDuplicates = [" "];

//------------------------------------------------------------------------------------------------------

// finding the position of Dropdown in the "Effects" property - first selected layer
var dropdown_pos = -1;
var dropdown_name = "";
var dropdown_counter = 0;

for (var i = 1; i <= selected[0].property("ADBE Effect Parade").numProperties; i++)
{
  if (selected[0].property("ADBE Effect Parade").property(i).property(1).isDropdownEffect === true && selected[0].property("ADBE Effect Parade").property(i).enabled === true)
  {
    dropdown_pos = i;
    dropdown_name = selected[0].property("ADBE Effect Parade").property(i).name;
    dropdown_counter++;
  }
}

//------------------------------------------------------------------------------------------------------

if (dropdown_counter > 1)
{
  alert("There are " + dropdown_counter + " active Dropdown menu effects on " + selected[0].name.toUpperCase() + " layer.\nDisable all except the one you want to affect.")
}

//------------------------------------------------------------------------------------------------------

// check if first selected has Dropdown Menu effect
else if (dropdown_pos == -1)
{
  alert("First selected layer doesn't have Dropdown Menu Control effect applied or the effect is disabled.");
}

//------------------------------------------------------------------------------------------------------
// ONLY DMENU SELECTED. EVERYTHING UNDER IS ADDED
else if (dropdown_pos != -1 && dropdown_counter == 1 && curItem.selectedLayers.length == 1)
{
  
  //RESETS ALL LAYERS AND REMOVES EXPRESSIONS FROM OPACITY
  for (var i = 1; i <= curItem.layers.length; i++)
  {
    curItem.layer(i).opacity.expression = 'transform.opacity';
    curItem.layer(i).enabled = true;
  }

  //storing selected layer names and indexes in new arrays. Removing everything after the last dot - file extensions 
  for (var i = selected[0].index + 1; i <= curItem.layers.length; i++)
  {
    if (curItem.layer(i).name.lastIndexOf(".") > -1)
    {
      selectedLayersName.push(curItem.layer(i).name.substr(0,curItem.layer(i).name.lastIndexOf(".")));  
    }
    else
    {
      selectedLayersName.push(curItem.layer(i).name);
    }
    selectedLayersIndex.push(curItem.layer(i).index);
  }

  for (var i = 0; i < selectedLayersName.length; i++)
  {
    //check if the current array value shows up later in the same array
    if (findDuplicatesInArray(selectedLayersName[i],selectedLayersName,i))
    {
      selectedLayerNamesRenamedDuplicates.push(selectedLayersName[i].trim().toString() + "_DUPLICATE_" + i);
      checkForDuplicates.push("DMenu index " + i + " : " + selectedLayersName[i].trim().toString());
    }
    else
    {
      selectedLayerNamesRenamedDuplicates.push(selectedLayersName[i].trim().toString());
    }
  }

  longestWord = findLongestWord(selectedLayerNamesRenamedDuplicates);

  //adds spaces to the end of the name till it has the same number of characters as the longest word. Array was bugging out when comparing names and giving 'false positives'
  for (var i = 0; i < selectedLayerNamesRenamedDuplicates.length; i++)  
  {
    selectedLayerNamesRenamedDuplicates[i] = addSpaces(selectedLayerNamesRenamedDuplicates[i],longestWord);
  }

  // Dropdown menu layer - first selected 
  var DMENULayerName = selected[0].name; 
  
  // set values in Dropdown Menu
  selected[0].property("ADBE Effect Parade").property(dropdown_pos).property(1).setPropertyParameters(selectedLayerNamesRenamedDuplicates);

  // Expression for every layer - link menu with visibility/opacity
  // using names for layer and effect - expressions won't break if you rename or move the layer
  for ( var i = selected[0].index + 1; i <= curItem.layers.length; i++)
  {
    curItem.layer(i).opacity.expression = 
    'var menu = thisComp.layer("'+DMENULayerName+'").effect("'+dropdown_name+'")(1);\nif ( menu == '+(i-selected[0].index)+' ){ 100; } else { 0; }';
  }

  for (var i = 1; i < selected[0].index; i++)
  {
    curItem.layer(i).enabled = false;
  }

  if (checkForDuplicates.length > 1)
  {
  alert("Duplicates at:\n(added _DUPLICATE_)\n" + checkForDuplicates.join("\n"));
  }

}

//------------------------------------------------------------------------------------------------------
//SELECT FIRST DMENU LAYER - THEN THE ONES YOU WANT THE EFFECT ON
else 
{

  //RESETS ALL LAYERS AND REMOVES EXPRESSIONS FROM OPACITY
  for (var i = 1; i <= curItem.layers.length; i++)
  {
    curItem.layer(i).opacity.expression = 'transform.opacity';
    curItem.layer(i).enabled = true;
  }

  //storing selected layer names and indexes in new arrays. Removing everything after the last dot - file extensions 
  for (var i = 1; i < selected.length; i++)
  {
    if (selected[i].name.lastIndexOf(".") > -1)
    {
      selectedLayersName.push(selected[i].name.substr(0,selected[i].name.lastIndexOf(".")));  
    }
    else
    {
      selectedLayersName.push(selected[i].name);
    }
    selectedLayersIndex.push(selected[i].index);
  }

  for (var i = 0; i < selectedLayersName.length; i++)
  {
    //check if the current array value shows up later in the same array
    if (findDuplicatesInArray(selectedLayersName[i],selectedLayersName,i))
    {
      checkForDuplicates.push("DMenu index " + (i+1) + " : " +selectedLayersName[i].trim().toString());
      selectedLayerNamesRenamedDuplicates.push(selectedLayersName[i].trim().toString() + "_DUPLICATE_" + i);
    
    }
    else
    {
      selectedLayerNamesRenamedDuplicates.push(selectedLayersName[i].trim().toString());
    }
  }

  longestWord = findLongestWord(selectedLayerNamesRenamedDuplicates);

  //adds spaces to the end of the name till it has the same number of characters as the longest word. Array was bugging out when comparing names and giving 'false positives'
  for (var i = 0; i < selectedLayerNamesRenamedDuplicates.length; i++)  
  {
    selectedLayerNamesRenamedDuplicates[i] = addSpaces(selectedLayerNamesRenamedDuplicates[i],longestWord);
  }

  // Dropdown menu layer - first selected 
  var DMENULayerName = selected[0].name; 
  
  // set values in Dropdown Menu
  selected[0].property("ADBE Effect Parade").property(dropdown_pos).property(1).setPropertyParameters(selectedLayerNamesRenamedDuplicates);

  // Expression for every layer - link menu with visibility/opacity
  // using names for layer and effect - expressions won't break if you rename or move the layer
  for (var i = 0; i < selectedLayersIndex.length; i++)
  {
    curItem.layer(selectedLayersIndex[i]).opacity.expression = 
    'var menu = thisComp.layer("'+DMENULayerName+'").effect("'+dropdown_name+'")(1);\nif ( menu == '+(i+1)+' ){ 100; } else { 0; }';
  }

  for (var i = 1; i <= curItem.layers.length; i++)
  {
    if(selectedLayersIndex.indexOf(curItem.layer(i).index) > -1)
    {
      curItem.layer(i).enabled = true;
    }
    else
    {
      curItem.layer(i).enabled = false;
    }
  }

  if (checkForDuplicates.length > 1)
  {
  alert("Duplicates at:\n(added _DUPLICATE_)\n" + checkForDuplicates.join("\n"));
  }
}

app.endUndoGroup();
    }


function reset() {

  app.beginUndoGroup("Reset");

  var proj = app.project;
  var curItem = proj.activeItem;
  
  for (var i = 1; i <= curItem.layers.length; i++)
  {
  curItem.layer(i).opacity.expression = 'transform.opacity';
  curItem.layer(i).enabled = true;
  }

  app.endUndoGroup();
    }

function help() {

alert('Help | Instructions:\n\nDropdown autopopulate v1 -\nSelect a layer with a Dropdown menu effect applied.\nAfter you run the "Dropdown autopopulate", the script will go thru every layer under it and add expression to opacity and link it to the Dropdown Menu.\n\nDropdown autopopulate v2 -\nFirst select the layer with the Dropdown Menu effect applied. After it, select one or more layers in the order you want them to appear in the Dropdown menu list. Layer opacity will be linked to the Dropdown menu.\n\nReset - \nRe-enables visibility on all layers in the currect composition. Removes all expressions from opacity.\nWARNING - "Dropdown autopopulate" option already does this, as part of the process!');

}
