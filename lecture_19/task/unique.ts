const unique1 = (str: string): string => {
	return str.replace(/(.)(?=.*\1)|(.)(?<=\2.+)/g, (_, $1, $2) => '');
}

console.log(unique1('abacefffgwb'));

// function unique(str: string): string {
// 	const chars: Record<string, number> = {};
//
// 	Array.from(str).forEach((char) => {
// 		chars[char] = (chars[char] ?? 0) + 1;
// 	});
//
// 	return str.replace(/./g, (s) => chars[s] > 1 ? '' : s);
// }
