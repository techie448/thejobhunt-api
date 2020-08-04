export default async (test, query, browser) => {
    const search = query.split(" ").join("-");

    const scrapeJobsGD = async (page, url) => {
        await page.goto(url, {waitUntil: 'networkidle2'});
        return await page.evaluate(()=>
            Array.from(document.querySelectorAll('.jl')).map(r=>({
                    title: r.querySelector('div.jobContainer > a') && r.querySelector('div.jobContainer > a').innerText.trim(),
                    company : r.querySelector('.jobEmpolyerName') && r.querySelector('.jobEmpolyerName').innerText.trim(),
                    location : r.querySelector('.loc') && r.querySelector('.loc').innerText.trim(),
                    created : r.querySelector('.pl-std') && r.querySelector('.pl-std').innerText.trim(),
                    apply : r.querySelector('.jobTitle') && r.querySelector('.jobTitle').href,
                    id : r.getAttribute('data-id'),
                    source : 'Glassdoor',
                })
            )
        );


    }
        const jobs = [];
        const page = await browser.newPage();
        await page.setDefaultNavigationTimeout(0);
        let end = 30;
        if(test) end = 1;

        jobs.push(...await scrapeJobsGD(page, `https://www.glassdoor.ca/Job/${search}-jobs-SRCH_KO0,17.htm?fromAge=30`));
        let pagination = 2;

        while(pagination<end){
            jobs.push(...await scrapeJobsGD(page, (`https://www.glassdoor.ca/Job/${search}-jobs-SRCH_KO0,17_IP${pagination}.htm?fromAge=30`)))
            pagination++;
        }
    console.log({
        query,
        source: 'glassdoor',
        results: jobs.length
    });
        await page.close();
        return jobs;



};
