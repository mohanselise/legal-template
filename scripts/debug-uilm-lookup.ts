/**
 * Debug script to test UILM key lookup logic
 * Simulates what happens in the homepage
 */

import { getMessages } from 'next-intl/server';
import { getAllTemplates } from '../lib/templates-db';

async function debugUilmLookup() {
  console.log('🔍 Debugging UILM Key Lookup...\n');

  try {
    // Simulate what the homepage does
    const messages = await getMessages({ locale: 'de' });
    const templates = await getAllTemplates();
    
    // Find the student template
    const studentTemplate = templates.find(t => t.slug === 'student');
    if (!studentTemplate) {
      console.log('❌ Student template not found');
      return;
    }
    
    console.log('📋 Student Template from DB:');
    console.log('  Title:', studentTemplate.title);
    console.log('  Description:', studentTemplate.description);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    console.log('  UILM Title Key:', (studentTemplate as any).uilmTitleKey);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    console.log('  UILM Description Key:', (studentTemplate as any).uilmDescriptionKey);
    
    // Check messages structure
    console.log('\n📦 Messages structure:');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const templatesModule = (messages as any)?.templates;
    if (!templatesModule) {
      console.log('❌ templates module not found in messages');
      return;
    }
    
    console.log('✅ templates module found');
    console.log('📋 Top-level keys in templates module:', Object.keys(templatesModule).slice(0, 30));
    
    // Test the lookup logic
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const uilmTitleKey = (studentTemplate as any).uilmTitleKey;
    if (uilmTitleKey) {
      console.log(`\n🔑 Looking for UILM Title Key: "${uilmTitleKey}"`);
      
      // Try 1: Direct lookup
      if (templatesModule[uilmTitleKey]) {
        console.log(`  ✅ Found via direct lookup: "${templatesModule[uilmTitleKey]}"`);
      } else {
        console.log(`  ❌ Not found via direct lookup`);
      }
      
      // Try 2: camelCase
      const camelKey = uilmTitleKey.toLowerCase().replace(/_([a-z0-9])/g, (g: string) => g[1].toUpperCase());
      console.log(`  🔄 Trying camelCase: "${camelKey}"`);
      if (templatesModule[camelKey]) {
        console.log(`  ✅ Found via camelCase: "${templatesModule[camelKey]}"`);
      } else {
        console.log(`  ❌ Not found via camelCase`);
      }
      
      // Try 3: lowercase
      const lowerKey = uilmTitleKey.toLowerCase();
      console.log(`  🔄 Trying lowercase: "${lowerKey}"`);
      if (templatesModule[lowerKey]) {
        console.log(`  ✅ Found via lowercase: "${templatesModule[lowerKey]}"`);
      } else {
        console.log(`  ❌ Not found via lowercase`);
      }
      
      // Search for keys containing parts of the UILM key
      console.log(`\n🔍 Searching for keys containing "student" or "STUDENT":`);
      const allKeys = Object.keys(templatesModule);
      const matchingKeys = allKeys.filter(k => 
        k.toLowerCase().includes('student') || k.includes('STUDENT')
      );
      if (matchingKeys.length > 0) {
        matchingKeys.forEach(key => {
          console.log(`  📌 ${key}: "${templatesModule[key]}"`);
        });
      } else {
        console.log('  ❌ No matching keys found');
      }
    }
    
    // Check templatesList structure
    console.log('\n📋 Checking templatesList structure:');
    const templatesList = templatesModule.templatesList;
    if (templatesList) {
      console.log('✅ templatesList found');
      console.log('  Available slugs:', Object.keys(templatesList));
      if (templatesList.student) {
        console.log('  Student template in templatesList:', templatesList.student);
      } else {
        console.log('  ❌ Student template not in templatesList');
      }
    } else {
      console.log('❌ templatesList not found');
    }
    
  } catch (error) {
    console.error('\n❌ ERROR:', error);
    if (error instanceof Error) {
      console.error('Stack:', error.stack);
    }
  }
}

// Run the debug
debugUilmLookup()
  .then(() => {
    console.log('\n✅ Debug completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Debug failed:', error);
    process.exit(1);
  });

