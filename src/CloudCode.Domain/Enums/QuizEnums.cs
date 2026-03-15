namespace CloudCode.Domain.Enums;

public enum QuizCategory
{
    Python = 1,
    JavaScript = 2,
    Algorithms = 3,
    DataStructures = 4,
    GeneralCS = 5
}

public enum QuizDifficulty
{
    Easy = 1,
    Medium = 2,
    Hard = 3
}

public enum QuizSessionStatus
{
    InProgress = 1,
    Completed = 2,
    Abandoned = 3
}

public enum QuizVsMatchStatus
{
    Waiting = 1,
    InProgress = 2,
    Finished = 3,
    Cancelled = 4
}
