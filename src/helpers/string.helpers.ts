export class StringHelpers
{
	static trim(input: string, replacements?: string[]) : string
	{
		replacements = replacements || [];
		return input.replace(new RegExp(`(^[${replacements.join()}\s]+)|([${replacements.join()}\s]+$)`, "g"), "")
	}

	static trimLeft(input: string, replacements?: string[]) : string
	{
		replacements = replacements || [];
		return input.replace(new RegExp(`(^[${replacements.join()}\s]+)`, "g"), "")
	}

	static trimRight(input: string, replacements?: string[]) : string
	{
		replacements = replacements || [];
		return input.replace(new RegExp(`([${replacements.join()}\s]+$)`, "g"), "")
	}
}
