console.log(zipStr1('abbaabbafffbezza'));

function zipStr1(str: string): string {
	let
		prev,
		res = str;

	do {
		prev = res;
		res = res.replace(/(.+)\1+/g, '$1');

	} while (prev.length !== res.length);

	return res;
}
