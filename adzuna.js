export default async (start) => {


    let resultSet = [], count = start, result = [1];

    while(result.length>0){
        try {
            const res = await fetch(`https://api.adzuna.com/v1/api/jobs/ca/search/${count}?app_id=962980b9&app_key=0a90e95c3f2f318bf11ca7733fbb6dbd&category=it-jobs&&content-type=application/json&results_per_page=50`);
            const resp = await res.json();
            const resp_string = JSON.stringify(resp);
            const resp_string_sanitized = resp_string.replace(/__/g, '');
            const resp_sanitized = JSON.parse(resp_string_sanitized);
            result = resp_sanitized.results;
            result = result.map(job => ({
                id: job.id || '',
                company: job.company.display_name || '',
                companyURL: '' || '',
                created: job.created || '',
                description: job.description || '',
                apply: job.redirect_url || '',
                location: [...job.location.area || '', job.location.display_name] || '',
                title: job.title || '',
                type: job.contract_type || '',
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
