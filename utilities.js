export const getDate = (dateString) => {
    const date = new Date();
    if(dateString instanceof Date){
        return dateString;
    }
    else if(dateString.match(/[0-9]+[ ]?[w]/g)){
        date.setDate(date.getDate() - 7)
    }else if(dateString.match(/[0-9]+[ ]?[d]/g)){
        const num = parseInt(dateString.match(/[0-9]+/g)[0]);
        date.setDate(date.getDate() - num)
    }else if(dateString.match(/[0-9]+[ ]?[m]/g) || dateString ==='30+ days ago'){
        date.setDate(date.getDate() - 31)
    }
    else if (dateString.match(/[0-9]+[ ]?[h]/g) || dateString === 'Just posted' || dateString === 'Today'){
    }
    else if (dateString === 'Yesterday') {
        date.setDate(date.getDate() - 1)
    }
    else {
        console.log(dateString)
    }
    return date;
}

export const permute = (permutation) => {
    let length = permutation.length,
        result = [permutation.slice()],
        c = new Array(length).fill(0),
        i = 1, k, p;

    while (i < length) {
        if (c[i] < i) {
            k = i % 2 && c[i];
            p = permutation[i];
            permutation[i] = permutation[k];
            permutation[k] = p;
            ++c[i];
            i = 1;
            result.push(permutation.slice());
        } else {
            c[i] = 0;
            ++i;
        }
    }
    return result;
}
