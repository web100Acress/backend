const fetch = require('node-fetch');

async function getAllProjects() {
  const baseUrl = 'http://localhost:3500/project/viewAll/data';
  const limit = 100;
  let allProjects = [];
  let page = 1;
  let hasMore = true;

  console.log('🔄 Fetching all projects from database...');
  
  while (hasMore) {
    try {
      const response = await fetch(`${baseUrl}?page=${page}&limit=${limit}`);
      const data = await response.json();
      
      if (data.data && data.data.length > 0) {
        allProjects = allProjects.concat(data.data);
        console.log(`📦 Page ${page}: Fetched ${data.data.length} projects`);
        
        if (data.data.length < limit) {
          hasMore = false;
        } else {
          page++;
        }
      } else {
        hasMore = false;
      }
    } catch (error) {
      console.error(`❌ Error fetching page ${page}:`, error.message);
      hasMore = false;
    }
  }

  console.log(`✅ Total projects fetched: ${allProjects.length}`);
  
  // Save to file
  const fs = require('fs');
  fs.writeFileSync('all_projects.json', JSON.stringify(allProjects, null, 2));
  console.log('💾 Saved to: all_projects.json');
  
  // Show sample data
  console.log('\n📊 Sample projects:');
  allProjects.slice(0, 5).forEach((project, index) => {
    console.log(`${index + 1}. ${project.projectName} - ${project.city} (${project.type})`);
  });
  
  return allProjects;
}

getAllProjects().catch(console.error);
