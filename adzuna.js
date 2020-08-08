import axios from 'axios'

export default async (test, query) => {

    const search = query.split(" ").join("+");
    let resultSet = [], count = 1, result = [1], country = 'ca';
    while(result.length>0){
        const url = `https://api.adzuna.com/v1/api/jobs/${country}/search/${count}?app_id=962980b9&app_key=0a90e95c3f2f318bf11ca7733fbb6dbd&what=${search}&max_days_old=14&sort_by=date&content-type=application/json&results_per_page=50`;
        try {
            let resp;
                const response = await axios.get(url);
                resp = response.data;

            const resp_string = JSON.stringify(resp);
            const resp_string_sanitized = resp_string.replace(/__/g, '').normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            const resp_sanitized = JSON.parse(resp_string_sanitized);
            result = resp_sanitized.results;
            result = result.map(job => ({
                id: job.id || '',
                company: job.company.display_name || '',
                created: new Date(job.created) || '',
                apply: job.redirect_url || '',
                location: job.location.display_name || '',
                title: job.title || '',
                source: 'Adzuna',
            }))
            if(count === 1 && test) {
                resultSet.push(...result);
                result = [];
            }


        } catch(err) {
            console.log(`ERROR: ${url}`);
            result = [];
        }
        resultSet.push(...result);


        if(result.length>0) count++;
    }
    console.log({
        query,
        source: 'Adzuna',
        results: resultSet.length
    });
    return resultSet;
};
