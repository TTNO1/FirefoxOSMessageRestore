
function goUpdateGlobalEditMenuItems(force){


if(!force&&typeof gEditUIVisible!="undefined"&&!gEditUIVisible){return;}
goUpdateCommand("cmd_undo");goUpdateCommand("cmd_redo");goUpdateCommand("cmd_cut");goUpdateCommand("cmd_copy");goUpdateCommand("cmd_paste");goUpdateCommand("cmd_selectAll");goUpdateCommand("cmd_delete");goUpdateCommand("cmd_switchTextDirection");}
function goUpdateUndoEditMenuItems(){goUpdateCommand("cmd_undo");goUpdateCommand("cmd_redo");}
function goUpdatePasteMenuItems(){goUpdateCommand("cmd_paste");}
window.addEventListener("DOMContentLoaded",()=>{

 let container=document.querySelector("commandset")||document.documentElement;let fragment=MozXULElement.parseXULToFragment(`
      <commandset id="editMenuCommands">
        <commandset id="editMenuCommandSetAll" commandupdater="true" events="focus,select" />
        <commandset id="editMenuCommandSetUndo" commandupdater="true" events="undo" />
        <commandset id="editMenuCommandSetPaste" commandupdater="true" events="clipboard" />
        <command id="cmd_undo" oncommand=";" />
        <command id="cmd_redo" oncommand=";" />
        <command id="cmd_cut" oncommand=";" />
        <command id="cmd_copy" oncommand=";" />
        <command id="cmd_paste" oncommand=";" />
        <command id="cmd_delete" oncommand=";" />
        <command id="cmd_selectAll" oncommand=";" />
        <command id="cmd_switchTextDirection" oncommand=";" />
      </commandset>
    `);let editMenuCommandSetAll=fragment.querySelector("#editMenuCommandSetAll");editMenuCommandSetAll.addEventListener("commandupdate",function(){goUpdateGlobalEditMenuItems();});let editMenuCommandSetUndo=fragment.querySelector("#editMenuCommandSetUndo");editMenuCommandSetUndo.addEventListener("commandupdate",function(){goUpdateUndoEditMenuItems();});let editMenuCommandSetPaste=fragment.querySelector("#editMenuCommandSetPaste");editMenuCommandSetPaste.addEventListener("commandupdate",function(){goUpdatePasteMenuItems();});fragment.firstElementChild.addEventListener("command",event=>{let commandID=event.target.id;goDoCommand(commandID);});container.appendChild(fragment);},{once:true});window.addEventListener("contextmenu",e=>{const HTML_NS="http://www.w3.org/1999/xhtml";let needsContextMenu=e.composedTarget.ownerDocument==document&&!e.defaultPrevented&&e.composedTarget.parentNode.nodeName!="moz-input-box"&&((["textarea","input"].includes(e.composedTarget.localName)&&e.composedTarget.namespaceURI==HTML_NS)||e.composedTarget.closest("search-textbox"));if(!needsContextMenu){return;}
let popup=document.getElementById("textbox-contextmenu");if(!popup){MozXULElement.insertFTLIfNeeded("toolkit/global/textActions.ftl");document.documentElement.appendChild(MozXULElement.parseXULToFragment(`
      <menupopup id="textbox-contextmenu" class="textbox-contextmenu">
        <menuitem data-l10n-id="text-action-undo" command="cmd_undo"></menuitem>
        <menuseparator></menuseparator>
        <menuitem data-l10n-id="text-action-cut" command="cmd_cut"></menuitem>
        <menuitem data-l10n-id="text-action-copy" command="cmd_copy"></menuitem>
        <menuitem data-l10n-id="text-action-paste" command="cmd_paste"></menuitem>
        <menuitem data-l10n-id="text-action-delete" command="cmd_delete"></menuitem>
        <menuseparator></menuseparator>
        <menuitem data-l10n-id="text-action-select-all" command="cmd_selectAll"></menuitem>
      </menupopup>
    `));popup=document.documentElement.lastElementChild;}
goUpdateGlobalEditMenuItems(true);popup.openPopupAtScreen(e.screenX,e.screenY,true);
e.preventDefault();});