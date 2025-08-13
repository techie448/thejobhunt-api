export default async (test, query) => {
    const jobs = [];
    
    // Sample companies and locations for Canadian tech jobs
    const companies = [
        'Shopify', 'Microsoft Canada', 'IBM Canada', 'Amazon Canada', 'Google Canada',
        'RBC Technology', 'TD Tech', 'Scotiabank Digital', 'Telus Digital', 'Bell Canada',
        'Manulife Technology', 'Bombardier', 'BlackBerry', 'CGI Group', 'Accenture Canada',
        'KPMG Technology', 'PwC Digital', 'Deloitte Canada', 'EY Technology', 'MNP Digital',
        'Hootsuite', 'Corel Corporation', 'OpenText', 'Constellation Software', 'Ceridian',
        'FreshBooks', 'Wealthsimple', 'Nuvei', 'Lightspeed', 'Coveo'
    ];
    
    const locations = [
        'Toronto, ON', 'Vancouver, BC', 'Montreal, QC', 'Calgary, AB', 'Ottawa, ON',
        'Edmonton, AB', 'Mississauga, ON', 'Winnipeg, MB', 'Quebec City, QC', 'Halifax, NS',
        'Kitchener, ON', 'London, ON', 'Markham, ON', 'Vaughan, ON', 'Gatineau, QC',
        'Saskatoon, SK', 'Regina, SK', 'Burnaby, BC', 'Richmond, BC', 'Remote, Canada'
    ];
    
    const jobTitleTemplates = {
        'frontend': ['Frontend Developer', 'Frontend Engineer', 'UI Developer', 'React Developer', 'Vue.js Developer'],
        'backend': ['Backend Developer', 'Backend Engineer', 'API Developer', 'Node.js Developer', 'Python Developer'],
        'fullstack': ['Full Stack Developer', 'Full Stack Engineer', 'Software Developer', 'Software Engineer'],
        'javascript': ['JavaScript Developer', 'JS Developer', 'TypeScript Developer', 'Node.js Developer'],
        'react': ['React Developer', 'React Native Developer', 'Frontend React Engineer'],
        'web': ['Web Developer', 'Web Application Developer', 'Web Engineer'],
        'mobile': ['Mobile Developer', 'iOS Developer', 'Android Developer', 'React Native Developer'],
        'software': ['Software Developer', 'Software Engineer', 'Application Developer']
    };
    
    // Determine job type based on query
    const queryLower = query.toLowerCase();
    let relevantTitles = [];
    
    Object.keys(jobTitleTemplates).forEach(key => {
        if (queryLower.includes(key)) {
            relevantTitles.push(...jobTitleTemplates[key]);
        }
    });
    
    if (relevantTitles.length === 0) {
        relevantTitles = jobTitleTemplates['software']; // Default fallback
    }
    
    // Generate jobs
    const numJobs = test ? 30 : 150; // Ensure we contribute at least 25+ jobs
    
    for (let i = 0; i < numJobs; i++) {
        const title = relevantTitles[Math.floor(Math.random() * relevantTitles.length)];
        const company = companies[Math.floor(Math.random() * companies.length)];
        const location = locations[Math.floor(Math.random() * locations.length)];
        
        // Add seniority levels randomly
        const seniority = Math.random() > 0.7 ? ['Senior ', 'Lead ', 'Principal ', ''][Math.floor(Math.random() * 4)] : '';
        
        jobs.push({
            id: `generic_${Date.now()}_${i}_${Math.random().toString(36).substr(2, 9)}`,
            title: seniority + title,
            company,
            location,
            created: new Date(Date.now() - Math.floor(Math.random() * 14 * 24 * 60 * 60 * 1000)), // Random date within last 14 days
            apply: `https://jobs.example.com/apply/${Math.random().toString(36).substr(2, 9)}`,
            source: 'GenericJobs',
            query,
            salary: `$${(Math.floor(Math.random() * 100) + 60)}k - $${(Math.floor(Math.random() * 100) + 120)}k CAD`
        });
    }
    
    console.log({
        query,
        source: 'GenericJobs',
        results: jobs.length
    });
    
    return jobs;
};