/* for testing htmlparser.js */

module.exports = {
  ROOT: -1,              // dummy root element (internal use)
  TAG: 1,                // ELEMENT_NODE (tag)
  ATTR: 2,               // ATTRIBUTE_NODE (attribute)
  TEXT: 3,               // TEXT_NODE (#text)
  COMMENT: 8,            // COMMENT_NODE (#comment)
  CDATA: 4,              // CDATA_SECTION_NODE
  DOCTYPE: 10,           // DOCUMENT_TYPE_NODE (html)
  DOCUMENT: 9,           // DOCUMENT_NODE
  EXPR: 32               // DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC (riot)
}
