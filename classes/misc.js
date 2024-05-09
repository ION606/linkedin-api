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