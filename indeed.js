export default async (test, query, browser) => {
    const search = query.split(" ").join("+");
    const scrapeJobs = async (page, url) => {
        await page.goto(url, {waitUntil: 'networkidle2'});

        return await page.evaluate(()=>
            Array.from(document.querySelectorAll('.clickcard')).map(r=>({
                    title: r.querySelector('.title') && r.querySelector('.title').innerText.trim(),
                    company : r.querySelector('.company') && r.querySelector('.company').innerText.trim(),
                    location : r.querySelector('.location') && r.querySelector('.location').innerText.trim(),
                    created : r.querySelector('.date') && r.querySelector('.date').innerText.trim(),
                    apply : r.querySelector('.jobtitle') && r.querySelector('.jobtitle').href.trim(),
                    id : r.id,
                    source : 'Indeed',
                })
            )
        );


    }
    const url = `https://ca.indeed.com/jobs?q=${search}&l=Canada&sort=date`
        const jobs = [];

        const page = await browser.newPage();
    await page.setDefaultNavigationTimeout(0);

        jobs.push(...await scrapeJobs(page, url));

        let pagination = 10;
        let recent = true;

        while(recent){
            jobs.push(...await scrapeJobs(page, (`${url}&start=${pagination}`)))
            pagination+=10;
            if(jobs[jobs.length-1].created.includes("30")) recent = false
            if(test) recent = false

        }
    console.log({
        query,
        source: 'indeed',
        results: jobs.length
    });
    await page.close();

    return jobs;
};
