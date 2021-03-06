<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" version="2.0"
  xmlns:gco="http://standards.iso.org/iso/19115/-3/gco/1.0"
	xmlns:util="java:java.util.UUID"
  xmlns:cit="http://standards.iso.org/iso/19115/-3/cit/1.0">

	<xsl:output method="text"/>
	<xsl:output method="xml" indent="yes" name="xml"/>

	<xsl:template match="/">

		<xsl:for-each select="//ROW">
			<xsl:variable name="name" select="COLUMN[@NAME='NAME']" />
			<xsl:variable name="isOrganisation" select="COLUMN[@NAME='TYPE']='O'" />
			<xsl:variable name="filename" select="concat('authors/',position(),'-',COLUMN[@NAME='TYPE'],'.xml')" />
			<xsl:message>Creating <xsl:value-of select="$filename"/></xsl:message>
			<xsl:result-document href="{$filename}" format="xml">

			<xsl:variable name="uuid" select="util:toString(util:randomUUID())"/>

	<cit:CI_Responsibility
		uuid="urn:ga-authors:{$uuid}"
		title="ResourceAuthor: {$name}">
		<cit:role>
			<cit:CI_RoleCode codeList="codeListLocation#CI_RoleCode" codeListValue="author">author</cit:CI_RoleCode>
		</cit:role>

			<xsl:choose>
				<xsl:when test="$isOrganisation">
	
		<cit:party>
			<cit:CI_Organisation>
      	<cit:name>
        	<gco:CharacterString><xsl:value-of select="$name"/></gco:CharacterString>
      	</cit:name>
			</cit:CI_Organisation>
		</cit:party>

				</xsl:when>
				<xsl:otherwise>

		<cit:party>
			<cit:CI_Individual>
     		<cit:name>
     			<gco:CharacterString><xsl:value-of select="$name"/></gco:CharacterString>
     		</cit:name>
				<!-- TODO: Use contact information for GA via XLink? -->
				<cit:contactInfo>
					<cit:CI_Contact>
						<!-- contact instructions holds the author contact order, filled out when author is added
						     by editor interface -->
						<cit:contactInstructions>
							<gco:CharacterString>{authorContactOrder}</gco:CharacterString>
						</cit:contactInstructions>
					</cit:CI_Contact>
				</cit:contactInfo>
			</cit:CI_Individual>
		</cit:party>

				</xsl:otherwise>
			</xsl:choose>

	</cit:CI_Responsibility>


			</xsl:result-document>
		</xsl:for-each>

	</xsl:template>

</xsl:stylesheet>
  
