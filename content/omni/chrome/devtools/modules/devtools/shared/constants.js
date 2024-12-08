"use strict";const AUDIT_TYPE={CONTRAST:"CONTRAST",KEYBOARD:"KEYBOARD",TEXT_LABEL:"TEXT_LABEL",};const ISSUE_TYPE={[AUDIT_TYPE.KEYBOARD]:{FOCUSABLE_NO_SEMANTICS:"FOCUSABLE_NO_SEMANTICS",FOCUSABLE_POSITIVE_TABINDEX:"FOCUSABLE_POSITIVE_TABINDEX",INTERACTIVE_NO_ACTION:"INTERACTIVE_NO_ACTION",INTERACTIVE_NOT_FOCUSABLE:"INTERACTIVE_NOT_FOCUSABLE",MOUSE_INTERACTIVE_ONLY:"MOUSE_INTERACTIVE_ONLY",NO_FOCUS_VISIBLE:"NO_FOCUS_VISIBLE",},[AUDIT_TYPE.TEXT_LABEL]:{AREA_NO_NAME_FROM_ALT:"AREA_NO_NAME_FROM_ALT",DIALOG_NO_NAME:"DIALOG_NO_NAME",DOCUMENT_NO_TITLE:"DOCUMENT_NO_TITLE",EMBED_NO_NAME:"EMBED_NO_NAME",FIGURE_NO_NAME:"FIGURE_NO_NAME",FORM_FIELDSET_NO_NAME:"FORM_FIELDSET_NO_NAME",FORM_FIELDSET_NO_NAME_FROM_LEGEND:"FORM_FIELDSET_NO_NAME_FROM_LEGEND",FORM_NO_NAME:"FORM_NO_NAME",FORM_NO_VISIBLE_NAME:"FORM_NO_VISIBLE_NAME",FORM_OPTGROUP_NO_NAME_FROM_LABEL:"FORM_OPTGROUP_NO_NAME_FROM_LABEL",FRAME_NO_NAME:"FRAME_NO_NAME",HEADING_NO_CONTENT:"HEADING_NO_CONTENT",HEADING_NO_NAME:"HEADING_NO_NAME",IFRAME_NO_NAME_FROM_TITLE:"IFRAME_NO_NAME_FROM_TITLE",IMAGE_NO_NAME:"IMAGE_NO_NAME",INTERACTIVE_NO_NAME:"INTERACTIVE_NO_NAME",MATHML_GLYPH_NO_NAME:"MATHML_GLYPH_NO_NAME",TOOLBAR_NO_NAME:"TOOLBAR_NO_NAME",},};const SCORES={AA:"AA",AAA:"AAA",BEST_PRACTICES:"BEST_PRACTICES",FAIL:"FAIL",WARNING:"WARNING",};const SIMULATION_TYPE={ PROTANOPIA:"PROTANOPIA", DEUTERANOPIA:"DEUTERANOPIA", TRITANOPIA:"TRITANOPIA", ACHROMATOPSIA:"ACHROMATOPSIA", CONTRAST_LOSS:"CONTRAST_LOSS",};const COMPATIBILITY_ISSUE_TYPE={CSS_PROPERTY:"CSS_PROPERTY",CSS_PROPERTY_ALIASES:"CSS_PROPERTY_ALIASES",};

const ELEMENT_STYLE=100;const MESSAGE_CATEGORY={CSS_PARSER:"CSS Parser",};module.exports={accessibility:{AUDIT_TYPE,ISSUE_TYPE,SCORES,SIMULATION_TYPE,},COMPATIBILITY_ISSUE_TYPE,MESSAGE_CATEGORY,style:{ELEMENT_STYLE,},};