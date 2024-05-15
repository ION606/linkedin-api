import { cursorTo } from "readline";


export class ReactionTypeCount {
    constructor({ count, reactionType }) {
        this.count = count;
        this.reactionType = reactionType;
    }
}

export class SocialActivityCounts {
    constructor({ entityUrn, numComments, numLikes, reactionTypeCounts, liked, preDashEntityUrn }) {
        this.entityUrn = entityUrn;
        this.numComments = numComments;
        this.numLikes = numLikes;
        this.reactionTypeCounts = reactionTypeCounts.map(count => new ReactionTypeCount(count));
        this.liked = liked;
        this.preDashEntityUrn = preDashEntityUrn;
    }
}

export class Group {
    constructor({ entityUrn }) {
        this.entityUrn = entityUrn;
    }
}

// Placeholder class for any other types
export class GenericEntity {
    constructor(data) {
        Object.assign(this, data);
    }
}


export class LoadingBar {
    constructor(size) {
        this.size = size;
        this.cursor = 0;
        this.timer = null;

        cursorTo(process.stdout, this.cursor);

        // draw the initial outline
        process.stdout.write("\x1B[?25l");
        for (let i = 0; i < this.size; i++) {
            process.stdout.write("\u2591");
        }
    }

    increment(amt = 1) {
        cursorTo(process.stdout, this.cursor);
        for (let i = 0; i < amt; i++) process.stdout.write("\u2588");
        this.cursor += amt;
    }
}