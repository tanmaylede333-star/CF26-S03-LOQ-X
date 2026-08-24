import { createClient } from '@supabase/supabase-js';
import { PREDEFINED_SCENARIOS } from '../src/data/scenarios';
import { INITIAL_CITY_NODES, INITIAL_CITY_EDGES } from '../src/data/cityGraph';

const supabaseUrl = 'https://oyebawwrqbrxeqrztqmd.supabase.co';
const supabaseKey = 'sb_publishable_gQ5SmD5ztHokbLyWQUpqyw_PGvEwaL_';

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
  console.log('--- SEEDING BENCHMARK SCENARIOS TO SUPABASE ---');

  for (const scenario of PREDEFINED_SCENARIOS) {
    if (scenario.id === 'scenario-custom') continue; // skip blank custom template

    const payload = {
      id: scenario.id,
      name: scenario.name,
      category: scenario.category,
      description: scenario.description,
      graph_version: scenario.graphVersion || 'city-v1',
      nodes: scenario.nodes || INITIAL_CITY_NODES,
      edges: scenario.edges || INITIAL_CITY_EDGES,
      initial_failures: scenario.initialFailures,
      parameters: scenario.parameters,
      scheduled_recoveries: scenario.scheduledRecoveries || [],
      is_benchmark: true,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('scenarios').upsert(payload, { onConflict: 'id' });
    if (error) {
      console.error(`Error inserting ${scenario.id}:`, error.message);
    } else {
      console.log(`✅ Seeded benchmark scenario: ${scenario.name}`);
    }
  }

  console.log('--- SEEDING COMPLETE ---');
}

seed().catch(console.error);
