/**
 * Test script to verify UILM translation keys are accessible
 * 
 * Usage: NEXT_PUBLIC_X_BLOCKS_KEY=YOUR_KEY pnpm tsx scripts/test-uilm-keys.ts
 */

import { fetchUilmTranslations } from '../lib/uilm-loader';

// Set the project key for testing
process.env.NEXT_PUBLIC_X_BLOCKS_KEY = process.env.NEXT_PUBLIC_X_BLOCKS_KEY || 'A25E76909C604E2EB617BB7075C472DF';

async function testUilmKeys() {
  console.log('🔍 Testing UILM Translation Keys...\n');

  try {
    // Test German translations
    console.log('📥 Fetching German (de-DE) translations from UILM...');
    const deTranslations = await fetchUilmTranslations('de');
    
    console.log('\n✅ Successfully fetched UILM translations for German');
    console.log('📦 Available modules:', Object.keys(deTranslations).join(', '));
    
    // Check templates module
    const templatesModule = deTranslations.templates;
    if (!templatesModule) {
      console.log('\n❌ ERROR: templates module not found in UILM translations');
      return;
    }
    
    console.log('\n📋 Templates module keys (first 20):');
    const templateKeys = Object.keys(templatesModule);
    console.log(templateKeys.slice(0, 20).join(', '));
    if (templateKeys.length > 20) {
      console.log(`... and ${templateKeys.length - 20} more keys`);
    }
    
    // Test specific keys
    const testKeys = [
      'STUDENT_AGREEMENT_TITLE',
      'STUDENT_AGREEMENT_DESCRIPTION',
      'studentAgreementTitle',
      'studentAgreementDescription',
      'student_agreement_title',
      'student_agreement_description',
    ];
    
    console.log('\n🔑 Testing specific keys:');
    for (const key of testKeys) {
      const value = templatesModule[key];
      if (value) {
        console.log(`  ✅ ${key}: "${value}"`);
      } else {
        console.log(`  ❌ ${key}: NOT FOUND`);
      }
    }
    
    // Try to find keys that contain "student" or "STUDENT"
    console.log('\n🔍 Searching for keys containing "student" or "STUDENT":');
    const studentKeys = templateKeys.filter(k => 
      k.toLowerCase().includes('student')
    );
    if (studentKeys.length > 0) {
      studentKeys.forEach(key => {
        console.log(`  📌 ${key}: "${templatesModule[key]}"`);
      });
    } else {
      console.log('  ❌ No keys found containing "student"');
    }
    
    // Show full structure for debugging
    console.log('\n📊 Full templates module structure (first level):');
    const firstLevelKeys = Object.keys(templatesModule).slice(0, 30);
    firstLevelKeys.forEach(key => {
      const value = templatesModule[key];
      const preview = typeof value === 'string' 
        ? (value.length > 50 ? value.substring(0, 50) + '...' : value)
        : typeof value;
      console.log(`  ${key}: ${preview}`);
    });
    
    // Test English translations for comparison
    console.log('\n\n📥 Fetching English (en-US) translations for comparison...');
    const enTranslations = await fetchUilmTranslations('en');
    const enTemplatesModule = enTranslations.templates;
    
    if (enTemplatesModule) {
      console.log('📋 English templates module keys (first 20):');
      const enKeys = Object.keys(enTemplatesModule);
      console.log(enKeys.slice(0, 20).join(', '));
      
      // Check if STUDENT keys exist in English
      const enStudentKeys = enKeys.filter(k => 
        k.toLowerCase().includes('student')
      );
      if (enStudentKeys.length > 0) {
        console.log('\n🔍 English keys containing "student":');
        enStudentKeys.forEach(key => {
          console.log(`  📌 ${key}: "${enTemplatesModule[key]}"`);
        });
      }
    }
    
  } catch (error) {
    console.error('\n❌ ERROR:', error);
    if (error instanceof Error) {
      console.error('Stack:', error.stack);
    }
  }
}

// Run the test
testUilmKeys()
  .then(() => {
    console.log('\n✅ Test completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  });

