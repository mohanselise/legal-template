import React from 'react';
import { Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import type { DocumentBlock } from '@/app/api/templates/employment-agreement/schema';

// Styles for different block types
const styles = StyleSheet.create({
  // Container styles
  article: {
    marginTop: 15,
    marginBottom: 10,
    width: '100%',
  },
  section: {
    marginTop: 10,
    marginBottom: 8,
    width: '100%',
  },
  
  // Text styles
  articleTitle: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 8,
    textTransform: 'uppercase',
    borderBottom: '1pt solid #000',
    paddingBottom: 2,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 6,
  },
  paragraph: {
    fontSize: 10,
    fontFamily: 'Helvetica',
    marginBottom: 8,
    lineHeight: 1.5,
    textAlign: 'justify',
  },
  
  // List styles
  list: {
    marginBottom: 8,
  },
  listItem: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  listMarker: {
    width: 25,
    fontSize: 10,
    fontFamily: 'Helvetica',
  },
  listContent: {
    flex: 1,
    fontSize: 10,
    fontFamily: 'Helvetica',
    lineHeight: 1.5,
  },
  
  // Definition styles
  definitionContainer: {
    marginBottom: 8,
    paddingLeft: 10,
    borderLeft: '2pt solid #eee',
  },
  definitionItem: {
    marginBottom: 6,
  },
  definitionTerm: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 2,
  },
  definitionDef: {
    fontSize: 10,
    fontFamily: 'Helvetica',
    lineHeight: 1.5,
  },
});

interface BlockRendererProps {
  block: DocumentBlock;
  level?: number;
}

export const BlockRenderer: React.FC<BlockRendererProps> = ({ block, level = 0 }) => {
  const { type, props = {}, children = [], text } = block;

  switch (type) {
    case 'article':
      return (
        <View style={styles.article}>
          <Text style={styles.articleTitle}>
            {props.number ? `ARTICLE ${props.number}: ` : ''}{props.title}
          </Text>
          {children.map((child, index) => (
            <BlockRenderer key={child.id || index} block={child} level={level + 1} />
          ))}
        </View>
      );

    case 'section':
      return (
        <View style={styles.section}>
          {props.title && (
            <Text style={styles.sectionTitle}>
              {props.number ? `${props.number} ` : ''}{props.title}
            </Text>
          )}
          {children.map((child, index) => (
            <BlockRenderer key={child.id || index} block={child} level={level + 1} />
          ))}
        </View>
      );

    case 'paragraph':
      return (
        <Text style={[styles.paragraph, props.style]}>
          {text}
          {children.map((child, index) => (
            <BlockRenderer key={child.id || index} block={child} level={level + 1} />
          ))}
        </Text>
      );

    case 'list':
      return (
        <View style={styles.list}>
          {children.map((child, index) => (
            <BlockRenderer 
              key={child.id || index} 
              block={child} 
              level={level + 1} 
            />
          ))}
        </View>
      );

    case 'list_item':
      return (
        <View style={styles.listItem}>
          <Text style={styles.listMarker}>{props.marker || '•'}</Text>
          <Text style={styles.listContent}>{text}</Text>
        </View>
      );

    case 'definition':
      return (
        <View style={styles.definitionContainer}>
          {children.map((child, index) => (
            <BlockRenderer key={child.id || index} block={child} level={level + 1} />
          ))}
        </View>
      );

    case 'definition_item':
      return (
        <View style={styles.definitionItem}>
          <Text style={styles.definitionTerm}>{props.term}</Text>
          <Text style={styles.definitionDef}>{text}</Text>
        </View>
      );

    default:
      // Fallback for unknown blocks: just render children
      return (
        <View>
          {children.map((child, index) => (
            <BlockRenderer key={child.id || index} block={child} level={level + 1} />
          ))}
        </View>
      );
  }
};

