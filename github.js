export default async (start) => {

    const req_url = "https://jobs.github.com/positions.json?page=";

    let resultSet = [], count = start, result = [1];

    while(result.length>0){
        try {
            const res = await fetch(`${req_url}${count}`);
            result = await res.json();
            result = result.map(job => ({
                id: job.id || '',
                company: job.company || '',
                companyURL: job.company_url || '',
                created: job.created_at || '',
                description: job.description || '',
                apply: job.url || '',
                location: [job.location] || '',
                title: job.title || '',
                type: job.type || '',
            }))
        } catch(err) {
            console.log(err);
            result = [];
        }
        resultSet.push(...result);

        console.log(`count: ${count} added: ${result.length} resultSet: ${resultSet.length}`);

        if(result.length>0) count++;
    }
    return resultSet;
};
