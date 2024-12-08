(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}(g.acorn||(g.acorn={})).walk=f()}})(function(){var define,module,exports;return(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){






"use strict";exports.__esModule=true;exports.simple=simple;exports.ancestor=ancestor;exports.recursive=recursive;exports.findNodeAt=findNodeAt;exports.findNodeAround=findNodeAround;exports.findNodeAfter=findNodeAfter;exports.findNodeBefore=findNodeBefore;exports.make=make;function _classCallCheck(instance,Constructor){if(!(instance instanceof Constructor)){throw new TypeError("Cannot call a class as a function");}}
function simple(node,visitors,base,state,override){if(!base)base=exports.base;(function c(node,st,override){var type=override||node.type,found=visitors[type];base[type](node,st,c);if(found)found(node,st);})(node,state,override);}

function ancestor(node,visitors,base,state){if(!base)base=exports.base;if(!state)state=[];(function c(node,st,override){var type=override||node.type,found=visitors[type];if(node!=st[st.length-1]){st=st.slice();st.push(node);}
base[type](node,st,c);if(found)found(node,st);})(node,state);}




function recursive(node,state,funcs,base,override){var visitor=funcs?exports.make(funcs,base):base;(function c(node,st,override){visitor[override||node.type](node,st,c);})(node,state,override);}
function makeTest(test){if(typeof test=="string")return function(type){return type==test;};else if(!test)return function(){return true;};else return test;}
var Found=function Found(node,state){_classCallCheck(this,Found);this.node=node;this.state=state;}

;function findNodeAt(node,start,end,test,base,state){test=makeTest(test);if(!base)base=exports.base;try{;(function c(node,st,override){var type=override||node.type;if((start==null||node.start<=start)&&(end==null||node.end>=end))base[type](node,st,c);if((start==null||node.start==start)&&(end==null||node.end==end)&&test(type,node))throw new Found(node,st);})(node,state);}catch(e){if(e instanceof Found)return e;throw e;}}

function findNodeAround(node,pos,test,base,state){test=makeTest(test);if(!base)base=exports.base;try{;(function c(node,st,override){var type=override||node.type;if(node.start>pos||node.end<pos)return;base[type](node,st,c);if(test(type,node))throw new Found(node,st);})(node,state);}catch(e){if(e instanceof Found)return e;throw e;}}
function findNodeAfter(node,pos,test,base,state){test=makeTest(test);if(!base)base=exports.base;try{;(function c(node,st,override){if(node.end<pos)return;var type=override||node.type;if(node.start>=pos&&test(type,node))throw new Found(node,st);base[type](node,st,c);})(node,state);}catch(e){if(e instanceof Found)return e;throw e;}}
function findNodeBefore(node,pos,test,base,state){test=makeTest(test);if(!base)base=exports.base;var max=undefined;(function c(node,st,override){if(node.start>pos)return;var type=override||node.type;if(node.end<=pos&&(!max||max.node.end<node.end)&&test(type,node))max=new Found(node,st);base[type](node,st,c);})(node,state);return max;}

function make(funcs,base){if(!base)base=exports.base;var visitor={};for(var type in base)visitor[type]=base[type];for(var type in funcs)visitor[type]=funcs[type];return visitor;}
function skipThrough(node,st,c){c(node,st);}
function ignore(_node,_st,_c){}
var base={};exports.base=base;base.Program=base.BlockStatement=function(node,st,c){for(var i=0;i<node.body.length;++i){c(node.body[i],st,"Statement");}};base.Statement=skipThrough;base.EmptyStatement=ignore;base.ExpressionStatement=base.ParenthesizedExpression=function(node,st,c){return c(node.expression,st,"Expression");};base.IfStatement=function(node,st,c){c(node.test,st,"Expression");c(node.consequent,st,"Statement");if(node.alternate)c(node.alternate,st,"Statement");};base.LabeledStatement=function(node,st,c){return c(node.body,st,"Statement");};base.BreakStatement=base.ContinueStatement=ignore;base.WithStatement=function(node,st,c){c(node.object,st,"Expression");c(node.body,st,"Statement");};base.SwitchStatement=function(node,st,c){c(node.discriminant,st,"Expression");for(var i=0;i<node.cases.length;++i){var cs=node.cases[i];if(cs.test)c(cs.test,st,"Expression");for(var j=0;j<cs.consequent.length;++j){c(cs.consequent[j],st,"Statement");}}};base.ReturnStatement=base.YieldExpression=function(node,st,c){if(node.argument)c(node.argument,st,"Expression");};base.ThrowStatement=base.SpreadElement=function(node,st,c){return c(node.argument,st,"Expression");};base.TryStatement=function(node,st,c){c(node.block,st,"Statement");if(node.handler){c(node.handler.param,st,"Pattern");c(node.handler.body,st,"ScopeBody");}
if(node.finalizer)c(node.finalizer,st,"Statement");};base.WhileStatement=base.DoWhileStatement=function(node,st,c){c(node.test,st,"Expression");c(node.body,st,"Statement");};base.ForStatement=function(node,st,c){if(node.init)c(node.init,st,"ForInit");if(node.test)c(node.test,st,"Expression");if(node.update)c(node.update,st,"Expression");c(node.body,st,"Statement");};base.ForInStatement=base.ForOfStatement=function(node,st,c){c(node.left,st,"ForInit");c(node.right,st,"Expression");c(node.body,st,"Statement");};base.ForInit=function(node,st,c){if(node.type=="VariableDeclaration")c(node,st);else c(node,st,"Expression");};base.DebuggerStatement=ignore;base.FunctionDeclaration=function(node,st,c){return c(node,st,"Function");};base.VariableDeclaration=function(node,st,c){for(var i=0;i<node.declarations.length;++i){c(node.declarations[i],st);}};base.VariableDeclarator=function(node,st,c){c(node.id,st,"Pattern");if(node.init)c(node.init,st,"Expression");};base.Function=function(node,st,c){if(node.id)c(node.id,st,"Pattern");for(var i=0;i<node.params.length;i++){c(node.params[i],st,"Pattern");}c(node.body,st,node.expression?"ScopeExpression":"ScopeBody");};
base.ScopeBody=function(node,st,c){return c(node,st,"Statement");};base.ScopeExpression=function(node,st,c){return c(node,st,"Expression");};base.Pattern=function(node,st,c){if(node.type=="Identifier")c(node,st,"VariablePattern");else if(node.type=="MemberExpression")c(node,st,"MemberPattern");else c(node,st);};base.VariablePattern=ignore;base.MemberPattern=skipThrough;base.RestElement=function(node,st,c){return c(node.argument,st,"Pattern");};base.ArrayPattern=function(node,st,c){for(var i=0;i<node.elements.length;++i){var elt=node.elements[i];if(elt)c(elt,st,"Pattern");}};base.ObjectPattern=function(node,st,c){for(var i=0;i<node.properties.length;++i){c(node.properties[i].value,st,"Pattern");}};base.Expression=skipThrough;base.ThisExpression=base.Super=base.MetaProperty=ignore;base.ArrayExpression=function(node,st,c){for(var i=0;i<node.elements.length;++i){var elt=node.elements[i];if(elt)c(elt,st,"Expression");}};base.ObjectExpression=function(node,st,c){for(var i=0;i<node.properties.length;++i){c(node.properties[i],st);}};base.FunctionExpression=base.ArrowFunctionExpression=base.FunctionDeclaration;base.SequenceExpression=base.TemplateLiteral=function(node,st,c){for(var i=0;i<node.expressions.length;++i){c(node.expressions[i],st,"Expression");}};base.UnaryExpression=base.UpdateExpression=function(node,st,c){c(node.argument,st,"Expression");};base.BinaryExpression=base.LogicalExpression=function(node,st,c){c(node.left,st,"Expression");c(node.right,st,"Expression");};base.AssignmentExpression=base.AssignmentPattern=function(node,st,c){c(node.left,st,"Pattern");c(node.right,st,"Expression");};base.ConditionalExpression=function(node,st,c){c(node.test,st,"Expression");c(node.consequent,st,"Expression");c(node.alternate,st,"Expression");};base.NewExpression=base.CallExpression=function(node,st,c){c(node.callee,st,"Expression");if(node.arguments)for(var i=0;i<node.arguments.length;++i){c(node.arguments[i],st,"Expression");}};base.MemberExpression=function(node,st,c){c(node.object,st,"Expression");if(node.computed)c(node.property,st,"Expression");};base.ExportNamedDeclaration=base.ExportDefaultDeclaration=function(node,st,c){if(node.declaration)c(node.declaration,st,node.type=="ExportNamedDeclaration"||node.declaration.id?"Statement":"Expression");if(node.source)c(node.source,st,"Expression");};base.ExportAllDeclaration=function(node,st,c){c(node.source,st,"Expression");};base.ImportDeclaration=function(node,st,c){for(var i=0;i<node.specifiers.length;i++){c(node.specifiers[i],st);}c(node.source,st,"Expression");};base.ImportSpecifier=base.ImportDefaultSpecifier=base.ImportNamespaceSpecifier=base.Identifier=base.Literal=ignore;base.TaggedTemplateExpression=function(node,st,c){c(node.tag,st,"Expression");c(node.quasi,st);};base.ClassDeclaration=base.ClassExpression=function(node,st,c){return c(node,st,"Class");};base.Class=function(node,st,c){if(node.id)c(node.id,st,"Pattern");if(node.superClass)c(node.superClass,st,"Expression");for(var i=0;i<node.body.body.length;i++){c(node.body.body[i],st);}};base.MethodDefinition=base.Property=function(node,st,c){if(node.computed)c(node.key,st,"Expression");c(node.value,st,"Expression");};base.ComprehensionExpression=function(node,st,c){for(var i=0;i<node.blocks.length;i++){c(node.blocks[i].right,st,"Expression");}c(node.body,st,"Expression");};},{}]},{},[1])(1)});