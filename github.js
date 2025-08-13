import axios from 'axios';
export default async (test, query) => {
    const search = query.split(" ").join("+");

    const url = `https://jobs.github.com/positions.json?description=${search}&location=canada&page=`;

    let resultSet = [], count = 0, result = [1];
    while(result.length>0){
        try {
            const res = await axios(`${url}${count}`);
            result = res.data;
            result = result.map(job => ({
                id: job.id || '',
                company: job.company || '',
                created: new Date(job.created_at) || '',
                apply: job.url || '',
                source: 'Github',
                location: job.location || '',
                title: job.title || '',
                query,
            }))
        } catch(err) {
            // console.log({err})
            console.log(`ERROR : ${url}${count}`)
            result = [];
        }
        resultSet.push(...result);
        if(result.length>0) count++;
    }

    console.log({
        query,
        source: 'Github',
        results: resultSet.length
    });

    return resultSet;
};
